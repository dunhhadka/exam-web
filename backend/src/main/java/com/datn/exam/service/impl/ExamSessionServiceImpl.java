package com.datn.exam.service.impl;

import com.datn.exam.model.dto.ExamSessionSetting;
import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.mapper.ExamSessionMapper;
import com.datn.exam.model.dto.request.ExamSessionFilterRequest;
import com.datn.exam.model.dto.request.ExamSessionRequest;
import com.datn.exam.model.dto.request.ExamSessionWhitelistEntryRequest;
import com.datn.exam.model.dto.request.IdsRequest;
import com.datn.exam.model.dto.request.SessionUserFilterRequest;
import com.datn.exam.model.dto.response.ExamSessionResponse;
import com.datn.exam.model.dto.response.ExamSessionWhitelistEntryResponse;
import com.datn.exam.model.dto.response.SessionStatsResponse;
import com.datn.exam.model.dto.response.SessionUserResponse;
import com.datn.exam.model.entity.Exam;
import com.datn.exam.model.entity.ExamAttempt;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.model.entity.Whitelist;
import com.datn.exam.repository.ExamAttemptRepository;
import com.datn.exam.repository.ExamRepository;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.repository.WhitelistRepository;
import com.datn.exam.repository.data.dao.ExamSessionDao;
import com.datn.exam.repository.data.dto.ExamSessionDto;
import com.datn.exam.service.ExamSessionService;
import com.datn.exam.service.S3Service;
import com.datn.exam.support.enums.error.AuthorizationError;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.InviteCodeUtils;
import com.datn.exam.support.util.JsonUtils;
import com.datn.exam.support.util.EmailUtils;
import com.datn.exam.support.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Slf4j
public class ExamSessionServiceImpl implements ExamSessionService {
    private final ExamSessionRepository examSessionRepository;
    private final ExamRepository examRepository;
    private final ExamSessionDao examSessionDao;
    private final ExamSessionMapper examSessionMapper;
    private final ExamAttemptRepository examAttemptRepository;
    private final S3Service s3Service;
    private final WhitelistRepository whitelistRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;


    @Transactional
    @Override
    public ExamSessionResponse create(ExamSessionRequest request) {
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_NOT_FOUND));

        this.validateWindow(request.getStartTime(), request.getEndTime());
        this.validateSettings(request);
        ExamSession.AccessMode accessMode = Optional.ofNullable(request.getAccessMode())
                .orElse(ExamSession.AccessMode.PUBLIC);
        this.validateAccessRequirements(accessMode, request, null);
        String encodedPassword = encodeAccessPassword(accessMode, request.getPassword(), null);

        String code = InviteCodeUtils.generate();
        while (examSessionRepository.existsByCode(code)) code = InviteCodeUtils.generate();

        String token = InviteCodeUtils.nextJoinToken();
        while (examSessionRepository.existsByJoinToken(token)) token = InviteCodeUtils.nextJoinToken();

        Map<String, Object> settingsMap = JsonUtils.toMap(request.getSettings());

        boolean publicFlag = accessMode == ExamSession.AccessMode.PUBLIC && request.isPublic();

        ExamSession session = ExamSession.builder()
                .exam(exam)
                .name(request.getName())
                .code(code)
                .joinToken(token)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .durationMinutes(request.getDurationMinutes())
                .lateJoinMinutes(request.getLateJoinMinutes())
                .shuffleQuestions(request.isShuffleQuestion())
                .shuffleAnswers(request.isShuffleAnswers())
                .isPublic(publicFlag)
                .accessMode(accessMode)
                .accessPassword(encodedPassword)
                .attemptLimit(request.getAttemptLimit())
                .settings(settingsMap)
                .examStatus(ExamSession.ExamStatus.OPEN)
                .deleted(Boolean.FALSE)
                .build();

        examSessionRepository.save(session);

        List<Whitelist> whitelists = synchronizeWhitelistEntries(session, request);

        return buildExamSessionResponse(session, whitelists);
    }


    @Override
    @Transactional
    public ExamSessionResponse update(Long id, ExamSessionRequest request) {
        Optional<String> username = SecurityUtils.getCurrentUser();

        ExamSession examSession = examSessionRepository.findById(id)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND, id));

        if (!Objects.equals(username.get(), examSession.getCreatedBy())) {
            throw new ResponseException(AuthorizationError.ACCESS_DENIED);
        }

        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_NOT_FOUND, request.getExamId()));

        this.validateWindow(request.getStartTime(), request.getEndTime());
        this.validateSettings(request);
        ExamSession.AccessMode accessMode = Optional.ofNullable(request.getAccessMode())
                .orElse(examSession.getAccessMode());
        this.validateAccessRequirements(accessMode, request, examSession);
        String encodedPassword = encodeAccessPassword(accessMode, request.getPassword(), examSession.getAccessPassword());

        String code = examSession.getCode();
        String joinToken = examSession.getJoinToken();

        examSessionMapper.updateExamSession(examSession, request);
        examSession.setExam(exam);
        examSession.setCode(code);
        examSession.setJoinToken(joinToken);
        examSession.setAccessMode(accessMode);
        boolean publicFlag = accessMode == ExamSession.AccessMode.PUBLIC && request.isPublic();
        examSession.setPublic(publicFlag);
        examSession.setAccessPassword(encodedPassword);

        examSessionRepository.save(examSession);

        List<Whitelist> whitelists = synchronizeWhitelistEntries(examSession, request);

        return buildExamSessionResponse(examSession, whitelists);
    }


    @Override
    public PageDTO<ExamSessionResponse> filter(ExamSessionFilterRequest request) {
        Long count = this.examSessionDao.count(request);

        if (Objects.equals(count, 0L)) {
            return PageDTO.empty(request.getPageIndex(), request.getPageSize());
        }

        List<ExamSessionDto> examSessionDtoList = this.examSessionDao.search(request);
        var examSessionIds = examSessionDtoList.stream()
                .map(ExamSessionDto::getId)
                .toList();

        var responses = this.getResponseByIds(examSessionIds).stream()
                .collect(Collectors.toMap(ExamSessionResponse::getId, Function.identity()));

        return PageDTO.of(
                examSessionDtoList.stream()
                        .map(e -> responses.get(e.getId()))
                        .toList(),
                request.getPageIndex(),
                request.getPageSize(),
                count
        );
    }

    private List<ExamSessionResponse> getResponseByIds(List<Long> examSessionIds) {
        if (CollectionUtils.isEmpty(examSessionIds)) {
            return List.of();
        }
        return this.examSessionRepository.findByIds(examSessionIds).stream()
                .map(session -> buildExamSessionResponse(session, null))
                .toList();
    }

    @Transactional
    @Override
    public void delete(IdsRequest request) {
        List<ExamSession> examSessions = examSessionRepository.findByIds(request.getIds());

        Set<Long> idsSet = examSessions.stream().map(ExamSession::getId)
                .collect(Collectors.toSet());

        String idsNotFound = request.getIds().stream()
                .filter(i -> !idsSet.contains(i))
                .map(String::valueOf)
                .collect(Collectors.joining(", "));

        if (StringUtils.isNotEmpty(idsNotFound)) {
            throw new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND, idsNotFound);
        }

        examSessionRepository.softDeleteByIds(request.getIds());
    }

    @Override
    public ExamSessionResponse getById(Long id) {
        ExamSession examSession = examSessionRepository.findById(id)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        return buildExamSessionResponse(examSession, null);
    }

    @Override
    public int count(ExamSessionFilterRequest request) {
        return this.examSessionDao.count(request).intValue();
    }

    private void validateWindow(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && !end.isAfter(start)) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_TIME_WINDOW_INVALID, start, end);
        }
    }

    private void validateSettings(ExamSessionRequest request) {
        var settings = request.getSettings();
        if (settings == null) return;

        var proctoring = settings.getProctoring();
        if (proctoring != null) {

            //Nếu requireIdUpload = true → bắt buộc phải dùng UPLOAD mode
            if (Boolean.TRUE.equals(proctoring.getRequireIdUpload())) {
                if (proctoring.getIdentityMode() != ExamSessionSetting.IdentityMode.UPLOAD) {
                    throw new ResponseException(BadRequestError.ID_UPLOAD_REQUIRES_UPLOAD_MODE);
                }
            }

            //Nếu identityMode = WEBCAM → bắt buộc phải bật giám sát
            if (proctoring.getIdentityMode() == ExamSessionSetting.IdentityMode.WEBCAM &&
                    !Boolean.TRUE.equals(proctoring.getMonitorEnabled())) {
                throw new ResponseException(BadRequestError.WEBCAM_MODE_REQUIRES_MONITORING);
            }

            //Nếu identityMode = NONE nhưng lại yêu cầu giám sát → sai
            if (proctoring.getIdentityMode() == ExamSessionSetting.IdentityMode.NONE &&
                    Boolean.TRUE.equals(proctoring.getMonitorEnabled())) {
                throw new ResponseException(BadRequestError.NONE_MODE_CANNOT_ENABLE_MONITORING);
            }
        }
    }

    private void validateAccessRequirements(ExamSession.AccessMode accessMode,
                                            ExamSessionRequest request,
                                            ExamSession existingSession) {
        if (accessMode == ExamSession.AccessMode.PASSWORD) {
            boolean hasExistingPassword = existingSession != null &&
                    StringUtils.isNotBlank(existingSession.getAccessPassword());
            if (StringUtils.isBlank(request.getPassword()) && !hasExistingPassword) {
                throw new ResponseException(BadRequestError.PASSWORD_REQUIRED);
            }
        }

        if (accessMode == ExamSession.AccessMode.WHITELIST) {
            boolean hasWhitelistPayload = CollectionUtils.isNotEmpty(request.getWhitelistEntries())
                    || CollectionUtils.isNotEmpty(request.getWhitelistEmails());
            if (!hasWhitelistPayload) {
                throw new ResponseException(BadRequestError.WHITELIST_REQUIRED);
            }
        }
    }

    private String encodeAccessPassword(ExamSession.AccessMode accessMode,
                                        String rawPassword,
                                        String existingEncoded) {
        if (accessMode != ExamSession.AccessMode.PASSWORD) {
            return null;
        }

        if (StringUtils.isNotBlank(rawPassword)) {
            return passwordEncoder.encode(rawPassword);
        }

        if (StringUtils.isNotBlank(existingEncoded)) {
            return existingEncoded;
        }

        throw new ResponseException(BadRequestError.PASSWORD_REQUIRED);
    }

    private List<Whitelist> synchronizeWhitelistEntries(ExamSession session, ExamSessionRequest request) {
        if (session.getId() == 0) {
            return Collections.emptyList();
        }

        if (session.getAccessMode() != ExamSession.AccessMode.WHITELIST) {
            List<Whitelist> existingWhitelists = whitelistRepository.findByExamSessionId(session.getId());
            if (CollectionUtils.isNotEmpty(existingWhitelists)) {
                // Xóa các file S3 cũ
                for (Whitelist existing : existingWhitelists) {
                    List<String> avatarUrls = existing.getAvatarUrls();
                    if (CollectionUtils.isNotEmpty(avatarUrls)) {
                        for (String url : avatarUrls) {
                            if (StringUtils.isNotBlank(url) && url.startsWith("http")) {
                                try {
                                    s3Service.deleteFile(url);
                                } catch (Exception ex) {
                                    log.warn("Failed to delete whitelist avatar {}", url, ex);
                                }
                            }
                        }
                    }
                }
                whitelistRepository.deleteAll(existingWhitelists);
                
                entityManager.flush();
                entityManager.clear();
            }
            return Collections.emptyList();
        }

        List<ExamSessionWhitelistEntryRequest> entries = resolveWhitelistEntries(request);
        if (CollectionUtils.isEmpty(entries)) {
            throw new ResponseException(BadRequestError.WHITELIST_REQUIRED);
        }

        List<Whitelist> existingWhitelists = whitelistRepository.findByExamSessionId(session.getId());
        Map<String, Whitelist> existingByEmail = existingWhitelists.stream()
                .collect(Collectors.toMap(Whitelist::getEmail, w -> w));

        List<Whitelist> whitelists = buildWhitelistEntitiesWithReuse(session, entries, existingByEmail);
        
        Set<String> urlsToKeep = whitelists.stream()
                .filter(Objects::nonNull)
                .map(Whitelist::getAvatarUrls)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toSet());

        if (CollectionUtils.isNotEmpty(existingWhitelists)) {
            for (Whitelist existing : existingWhitelists) {
                List<String> avatarUrls = existing.getAvatarUrls();
                if (CollectionUtils.isNotEmpty(avatarUrls)) {
                    for (String url : avatarUrls) {
                        if (StringUtils.isNotBlank(url) && url.startsWith("http")) {
                            if (!urlsToKeep.contains(url)) {
                                try {
                                    s3Service.deleteFile(url);
                                } catch (Exception ex) {
                                    log.warn("Failed to delete whitelist avatar {}", url, ex);
                                }
                            }
                        }
                    }
                }
            }
            whitelistRepository.deleteAll(existingWhitelists);
            
            entityManager.flush();
            entityManager.clear();
            log.debug("Flushed {} existing whitelist entries for session {}", existingWhitelists.size(), session.getId());
        }

        if (whitelists.isEmpty()) {
            return Collections.emptyList();
        }

        return whitelistRepository.saveAll(whitelists);
    }

    private List<Whitelist> buildWhitelistEntitiesWithReuse(ExamSession session,
                                                            List<ExamSessionWhitelistEntryRequest> entries,
                                                            Map<String, Whitelist> existingByEmail) {
        List<Whitelist> results = new ArrayList<>();
        Set<String> seenEmails = new HashSet<>();

        for (ExamSessionWhitelistEntryRequest entry : entries) {
            String email = entry.getEmail();
            if (StringUtils.isBlank(email)) {
                continue;
            }

            String normalizedEmail = email.trim().toLowerCase();
            if (!EmailUtils.isValidEmail(normalizedEmail)) {
                throw new ResponseException(BadRequestError.INVALID_EMAIL_FORMAT);
            }

            if (!seenEmails.add(normalizedEmail)) {
                continue;
            }

            Whitelist existingWhitelist = existingByEmail.get(normalizedEmail);
            List<String> avatarUrls;

            if (CollectionUtils.isNotEmpty(entry.getAvatarImages())) {
                avatarUrls = uploadWhitelistAvatars(session.getId(), normalizedEmail, entry.getAvatarImages());
            } 
            else if (existingWhitelist != null && CollectionUtils.isNotEmpty(existingWhitelist.getAvatarUrls())) {
                avatarUrls = new ArrayList<>(existingWhitelist.getAvatarUrls());
                log.debug("Reusing {} existing avatar URLs for email: {}", avatarUrls.size(), normalizedEmail);
            } 
            else {
                avatarUrls = Collections.emptyList();
            }

            results.add(Whitelist.builder()
                    .examSession(session)
                    .email(normalizedEmail)
                    .avatarUrls(new ArrayList<>(avatarUrls))
                    .build());
        }

        return results;
    }

    private List<ExamSessionWhitelistEntryRequest> resolveWhitelistEntries(ExamSessionRequest request) {
        if (CollectionUtils.isNotEmpty(request.getWhitelistEntries())) {
            return request.getWhitelistEntries();
        }

        if (CollectionUtils.isEmpty(request.getWhitelistEmails())) {
            return Collections.emptyList();
        }

        return request.getWhitelistEmails().stream()
                .filter(StringUtils::isNotBlank)
                .map(email -> ExamSessionWhitelistEntryRequest.builder().email(email).build())
                .collect(Collectors.toList());
    }

    private List<Whitelist> buildWhitelistEntities(ExamSession session,
                                                   List<ExamSessionWhitelistEntryRequest> entries) {
        List<Whitelist> results = new ArrayList<>();
        Set<String> seenEmails = new HashSet<>();

        for (ExamSessionWhitelistEntryRequest entry : entries) {
            String email = entry.getEmail();
            if (StringUtils.isBlank(email)) {
                continue;
            }

            String normalizedEmail = email.trim().toLowerCase();
            if (!EmailUtils.isValidEmail(normalizedEmail)) {
                throw new ResponseException(BadRequestError.INVALID_EMAIL_FORMAT);
            }

            if (!seenEmails.add(normalizedEmail)) {
                continue;
            }

            List<String> avatarUrls = uploadWhitelistAvatars(session.getId(), normalizedEmail, entry.getAvatarImages());

            results.add(Whitelist.builder()
                    .examSession(session)
                    .email(normalizedEmail)
                    .avatarUrls(new ArrayList<>(avatarUrls))
                    .build());
        }

        return results;
    }

    private List<String> uploadWhitelistAvatars(Long sessionId,
                                                String normalizedEmail,
                                                List<String> avatarImages) {
        if (CollectionUtils.isEmpty(avatarImages)) {
            return Collections.emptyList();
        }

        List<String> uploadedUrls = new ArrayList<>();
        int index = 0;

        for (String avatar : avatarImages) {
            if (StringUtils.isBlank(avatar)) {
                continue;
            }

            if (avatar.startsWith("http")) {
                uploadedUrls.add(avatar);
                continue;
            }

            if (uploadedUrls.size() >= 5) {
                break;
            }

            String sanitizedEmail = normalizedEmail.replace("@", "_at_").replace(".", "_");
            String key = String.format("whitelists/%d/%s/%d", sessionId, sanitizedEmail, ++index);

            try {
                String url = s3Service.uploadFromBase64(avatar, key);
                uploadedUrls.add(url);
            } catch (IOException e) {
                log.error("Failed to upload whitelist avatar for {}", normalizedEmail, e);
                throw new ResponseException(BadRequestError.FILE_UPLOAD_FAILED);
            }
        }

        return uploadedUrls;
    }

    private ExamSessionResponse buildExamSessionResponse(ExamSession session, List<Whitelist> persistedWhitelists) {
        ExamSessionResponse response = examSessionMapper.toExamSessionResponse(session);
        response.setAccessMode(session.getAccessMode());
        response.setHasAccessPassword(StringUtils.isNotBlank(session.getAccessPassword()));

        List<Whitelist> whitelistList = persistedWhitelists;
        if (whitelistList == null && session.getId() != 0) {
            whitelistList = whitelistRepository.findByExamSessionId(session.getId());
        }

        if (CollectionUtils.isEmpty(whitelistList)) {
            response.setWhitelistEntries(Collections.emptyList());
        } else {
            response.setWhitelistEntries(
                    whitelistList.stream()
                            .map(this::toWhitelistResponse)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList())
            );
        }

        return response;
    }

    private ExamSessionWhitelistEntryResponse toWhitelistResponse(Whitelist whitelist) {
        if (whitelist == null) {
            return null;
        }

        List<String> avatarUrls = whitelist.getAvatarUrls();
        List<String> sanitized = CollectionUtils.isEmpty(avatarUrls)
                ? Collections.emptyList()
                : new ArrayList<>(avatarUrls);

        return ExamSessionWhitelistEntryResponse.builder()
                .email(whitelist.getEmail())
                .avatarImages(sanitized)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SessionStatsResponse getSessionStats(Long id) {
        ExamSession session = examSessionRepository.findById(id)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND, id));

        List<ExamAttempt> attempts = examAttemptRepository.findByExamSessionId(id);
        long uniqueStudents = attempts.stream()
                .map(ExamAttempt::getStudentEmail)
                .distinct()
                .count();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String startDate = session.getStartTime() != null ? session.getStartTime().format(formatter) : "N/A";
        String endDate = session.getEndTime() != null ? session.getEndTime().format(formatter) : "N/A";

        return SessionStatsResponse.builder()
                .code(session.getCode())
                .startDate(startDate)
                .endDate(endDate)
                .totalStudents((int) uniqueStudents)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageDTO<SessionUserResponse> getSessionUsers(Long id, SessionUserFilterRequest request) {
        examSessionRepository.findById(id)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND, id));

        List<ExamAttempt> attempts = examAttemptRepository.findByExamSessionId(id);

        Map<String, List<ExamAttempt>> studentAttempts = attempts.stream()
                .collect(Collectors.groupingBy(ExamAttempt::getStudentEmail));

        List<SessionUserResponse> users = studentAttempts.entrySet().stream()
                .map(entry -> {
                    String email = entry.getKey();
                    List<ExamAttempt> userAttempts = entry.getValue();
                    ExamAttempt latestAttempt = userAttempts.get(0);

                    return SessionUserResponse.builder()
                            .id(latestAttempt.getId())
                            .name(latestAttempt.getStudentName())
                            .role("Học viên")
                            .email(email)
                            .code(latestAttempt.getStudentName()) // Using name as code for now
                            .gender("Không rõ")
                            .status("Hoạt động")
                            .build();
                })
                .toList();

        // Apply filters
        List<SessionUserResponse> filteredUsers = users.stream()
                .filter(user -> {
                    if (StringUtils.isNotBlank(request.getSearchText())) {
                        String search = request.getSearchText().toLowerCase();
                        return user.getName().toLowerCase().contains(search) ||
                                user.getEmail().toLowerCase().contains(search) ||
                                user.getCode().toLowerCase().contains(search);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        // Pagination
        int total = filteredUsers.size();
        int pageIndex = request.getPageIndex();
        int pageSize = request.getPageSize();
        int start = pageIndex * pageSize;
        int end = Math.min(start + pageSize, total);

        List<SessionUserResponse> paginatedUsers = start < total
                ? filteredUsers.subList(start, end)
                : new ArrayList<>();

        return PageDTO.of(paginatedUsers, pageIndex, pageSize, (long) total);
    }
}
