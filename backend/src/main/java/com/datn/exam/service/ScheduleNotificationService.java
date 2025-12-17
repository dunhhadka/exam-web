package com.datn.exam.service;

import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.model.entity.Notification;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.repository.SessionStudentRepository;
import com.datn.exam.repository.UserRepository;
import com.datn.exam.repository.data.NotificationRepository;
import com.datn.exam.repository.projection.SessionUserProjection;
import com.datn.exam.support.util.JsonUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleNotificationService {

    private static final int REMINDER_WINDOW_SIZE = 5;
    private static final int REDIS_TTL_HOURS = 24;

    private static final CacheKeyStrategy cacheKeyStrategy = new DefaultKeyStrategy();

    // first level cache
    private static final ConcurrentHashMap<String, ReminderStatus> localCache = new ConcurrentHashMap<>();
    // second level cache
    private final RedisTemplate<String, String> redisTemplate;

    private final NotificationRepository notificationRepository;

    private final ExamSessionRepository examSessionRepository;

    private final SessionStudentRepository sessionStudentRepository;

    private final UserRepository userRepository;

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void sendExamReminder() {
        var now = LocalDateTime.now();
        var reminderWindow = now.plusMinutes(REMINDER_WINDOW_SIZE);

        var upComingExamSessions = examSessionRepository.findUpComingReminder(now, reminderWindow);
        if (upComingExamSessions.isEmpty()) {
            log.info("UpComing ExamSessions is empty");
            return;
        }

        log.info("Found {} upcoming sessions", upComingExamSessions.size());

        var examSessionIds = upComingExamSessions.stream()
                .map(ExamSession::getId)
                .distinct()
                .toList();

        var userIdsExamSessions = sessionStudentRepository.findUserIdsBySessionIds(examSessionIds)
                .stream()
                .collect(Collectors.groupingBy(
                        SessionUserProjection::getExamSessionId,
                        Collectors.mapping(SessionUserProjection::getUserId, Collectors.toList())
                ));

        for (var examSession : upComingExamSessions) {
            try {
                sendReminderForExamSession(examSession, userIdsExamSessions);
            } catch (Exception e) {
                log.error("Failed to send reminder for session {}: {}",
                        examSession.getId(),
                        e.getMessage());
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendReminderForExamSession(
            ExamSession examSession,
            Map<Long, List<UUID>> userIdsExamSessions) {

        final var examSessionId = examSession.getId();

        // TODO: N + 1 query
        var userIds = findUserNeedSend(examSession, userIdsExamSessions);
        if (userIds.isEmpty()) {
            log.info("Users in the examSession {} empty", examSessionId);
        }

        String examSessionIdString = String.valueOf(examSessionId);

        List<Notification> notifications = new ArrayList<>();

        for (var userId : userIds) {
            if (hasAlreadySentReminder(examSession, userId)) {
                log.debug("Reminder already sent for examSession {} and userId {}",
                        examSessionIdString,
                        userId);
                continue;
            }

            var notification = buildNotification(examSession, userId);
            notifications.add(notification);
        }

        if (!notifications.isEmpty()) {
            notificationRepository.saveAll(notifications);

            for (var userId : userIds) {
                try {
                    this.markToCache(examSession, userId);
                } catch (Exception e) {
                    log.warn("Failed to update cache for user {}: {}",
                            userId,
                            examSession.getId());
                }
            }
        }
    }

    private List<String> findUserNeedSend(ExamSession examSession, Map<Long, List<UUID>> userIdsExamSessions) {
        var userIds = userIdsExamSessions.getOrDefault(examSession.getId(), List.of())
                .stream()
                .map(UUID::toString)
                .toList();

        var createdUsers = userRepository.findByEmail(examSession.getCreatedBy());

        return Stream.concat(
                        userIds.stream(),
                        createdUsers.stream()
                                .map(u -> u.getId().toString())
                )
                .toList();
    }

    private void markToCache(ExamSession examSession, String userId) {
        var reminderStatus = buildReminderStatus(examSession);

        this.putLocalCache(examSession, userId, reminderStatus);
        this.putToRedis(examSession, userId, reminderStatus);
    }

    private void putToRedis(
            ExamSession examSession,
            String userId,
            ReminderStatus reminderStatus) {

        String redisKey = cacheKeyStrategy.redisCacheKey(String.valueOf(examSession.getId()), userId);

        try {
            this.redisTemplate.opsForValue().set(
                    redisKey,
                    JsonUtils.marshal(reminderStatus),
                    REDIS_TTL_HOURS,
                    TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            log.error("Error during put value to redis {} : {}",
                    redisKey,
                    e.getMessage());
        }
    }

    private Notification buildNotification(ExamSession examSession, String userId) {
        LocalDateTime now = LocalDateTime.now();
        Duration timeUntilStart = Duration.between(now, examSession.getStartTime());
        long minutesUntilStart = timeUntilStart.toMinutes();

        if (minutesUntilStart < 0) {
            minutesUntilStart = 0;
        }

        return Notification.builder()
                .content("Bài thi: %s sẽ bắt đầu trong %s phút tới".formatted(
                        examSession.getName(),
                        minutesUntilStart))
                .type(Notification.Type.EXAM_REMINDER)
                .receiveId(userId)
                .isRead(false)
                .isDeleted(false)
                .build();
    }

    private boolean hasAlreadySentReminder(ExamSession examSession, String userId) {
        return findLocal(examSession, userId)
                .or(() -> findRedis(examSession, userId))
                .orElse(false);
    }

    private Optional<Boolean> findRedis(
            ExamSession examSession,
            String userId) {

        final String examSessionId = String.valueOf(examSession.getId());

        String redisKey = cacheKeyStrategy.redisCacheKey(examSessionId, userId);

        try {
            String jsonValue = redisTemplate.opsForValue().get(redisKey);
            if (jsonValue == null) {
                return Optional.of(false);
            }

            var remainderStatus = JsonUtils.unmarshal(jsonValue, ReminderStatus.class);
            if (checkNotSame(remainderStatus, examSession, userId)) {
                return Optional.of(false);
            }

            this.updateLocalCache(examSession, userId);

            return Optional.of(true);
        } catch (JsonProcessingException e) {
            log.error("Error during get value from redis with cache key {}", redisKey);
            return Optional.empty();
        }
    }

    private void updateLocalCache(ExamSession examSession, String userId) {
        var reminderStatus = buildReminderStatus(examSession);

        this.putLocalCache(examSession, userId, reminderStatus);
    }

    private void putLocalCache(
            ExamSession examSession,
            String userId,
            ReminderStatus reminderStatus) {

        var localKey = cacheKeyStrategy.localCacheKey(String.valueOf(examSession.getId()), userId);

        localCache.put(localKey, reminderStatus);
    }

    private ReminderStatus buildReminderStatus(ExamSession examSession) {
        return new ReminderStatus(
                LocalDateTime.now(),
                examSession.getStartTime(),
                examSession.getEndTime()
        );
    }

    private boolean checkNotSame(
            ReminderStatus remainderStatus,
            ExamSession examSession,
            String userId) {

        if (remainderStatus.sameExamSession(examSession)) {
            return false;
        }

        log.debug("ExamSession {} already updated", examSession.getId());
        this.invalidCache(String.valueOf(examSession.getId()), userId);

        return true;
    }

    private Optional<Boolean> findLocal(
            ExamSession examSession,
            String userId) {

        String localKey = cacheKeyStrategy.localCacheKey(String.valueOf(examSession.getId()), userId);

        var reminderStatus = localCache.get(localKey);
        if (reminderStatus == null) {
            return Optional.empty();
        }

        if (checkNotSame(reminderStatus, examSession, userId)) {
            return Optional.empty();
        }

        return Optional.of(true);
    }

    private void invalidCache(String examSessionId, String userId) {
        var localKey = cacheKeyStrategy.localCacheKey(examSessionId, userId);
        var redisKey = cacheKeyStrategy.redisCacheKey(examSessionId, userId);

        invalidLocalCache(localKey);
        invalidRedisCache(redisKey);
    }

    private void invalidRedisCache(String redisKey) {
        redisTemplate.delete(redisKey);
    }


    private void invalidLocalCache(String key) {
        localCache.remove(key);
    }

    // Cache value model
    public record ReminderStatus(
            LocalDateTime createdAt,
            LocalDateTime examStartAt,
            LocalDateTime examEndAt) {

        public boolean sameExamSession(ExamSession examSession) {
            return Objects.equals(examStartAt, examSession.getStartTime())
                    && Objects.equals(examEndAt, examSession.getEndTime());
        }
    }

    // Cache key pattern
    public interface CacheKeyStrategy {
        String localCacheKey(String examId, String userId);

        String redisCacheKey(String examId, String userId);
    }

    static class DefaultKeyStrategy implements CacheKeyStrategy {

        private static final String LOCAL_KEY_PATTERN = "local:exam:reminder:%s:%s";
        private static final String REDIS_KEY_PATTERN = "redis:exam:reminder:%s:%s";

        @Override
        public String localCacheKey(String examId, String userId) {
            require(examId, userId);
            return String.format(LOCAL_KEY_PATTERN, examId, userId);
        }

        @Override
        public String redisCacheKey(String examId, String userId) {
            require(examId, userId);
            return String.format(REDIS_KEY_PATTERN, examId, userId);
        }

        private void require(String examId, String userId) {
            Assert.notNull(examId, "ExamId is required");
            Assert.notNull(userId, "UserId is required");
        }
    }
}
