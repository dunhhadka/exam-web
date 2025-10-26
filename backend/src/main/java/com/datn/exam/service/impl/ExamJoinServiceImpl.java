package com.datn.exam.service.impl;

import com.datn.exam.model.dto.request.JoinByCodeRequest;
import com.datn.exam.model.dto.request.JoinSessionMetaResponse;
import com.datn.exam.model.dto.request.OtpRequest;
import com.datn.exam.model.dto.request.VerifyOtpRequest;
import com.datn.exam.model.dto.response.GuestAccess;
import com.datn.exam.model.dto.response.SessionTokenResponse;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.repository.ExamAttemptRepository;
import com.datn.exam.repository.ExamSessionAccessRepository;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.repository.UserRepository;
import com.datn.exam.service.ExamJoinService;
import com.datn.exam.service.OtpService;
import com.datn.exam.support.constants.MessageConstants;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class ExamJoinServiceImpl implements ExamJoinService {
    private static final String GUEST_TOKEN_KEY = "exam:guest:token:%s";
    private static final long TOKEN_TTL_HOURS = 2;

    private final ExamSessionRepository examSessionRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final OtpService otpService;
    private final RedisTemplate<String, String> redisTemplate;
    private final ExamSessionAccessRepository examSessionAccessRepository;
    private final UserRepository userRepository;

    @Override
    public JoinSessionMetaResponse joinByToken(String joinToken) {

        ExamSession session = examSessionRepository.findByJoinToken(joinToken)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        return this.buildJoinMeta(session, null);
    }

    @Transactional(readOnly = true)
    @Override
    public JoinSessionMetaResponse joinByCode(JoinByCodeRequest request) {
        ExamSession session = examSessionRepository.findByCode(request.getCode())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        return this.buildJoinMeta(session, null);
    }

    @Override
    public void requestOtp(OtpRequest request) {
        ExamSession examSession = examSessionRepository.findByCode(request.getSessionCode())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        String email = request.getEmail().toLowerCase();

        boolean existEmailTeacher = userRepository.existsTeacherByEmail(email);

        if (existEmailTeacher) {
            throw new ResponseException(BadRequestError.TEACHER_CANNOT_JOIN);
        }

        if (examSession.getAccessMode() == ExamSession.AccessMode.WHITELIST) {
            boolean isWhitelisted = examSessionAccessRepository
                    .existsByExamSessionIdAndEmail(examSession.getId(), email);

            if (!isWhitelisted) {
                throw new ResponseException(BadRequestError.EMAIL_NOT_IN_WHITELIST);
            }
        }

        otpService.sendOtp(email, examSession);
    }

    @Override
    public SessionTokenResponse verifyOtp(VerifyOtpRequest request) {
        ExamSession session = examSessionRepository.findByCode(request.getSessionCode())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        String email = request.getEmail();

        boolean valid = otpService.verifyOtp(email, session.getId(), request.getOtp());
        if (!valid) {
            throw new ResponseException(BadRequestError.INVALID_OTP);
        }

        String token = UUID.randomUUID().toString();

        String key = String.format(GUEST_TOKEN_KEY, token);
        String value = String.format("%s:%s", session.getId(), email);
        redisTemplate.opsForValue().set(key, value, TOKEN_TTL_HOURS, TimeUnit.HOURS);

        return SessionTokenResponse.builder()
                .tokenJoinStart(token)
                .sessionId(session.getId())
                .sessionName(session.getName())
                .email(email)
                .build();
    }

    @Override
    public void resendOtp(OtpRequest request) {
        ExamSession examSession = examSessionRepository.findByCode(request.getSessionCode())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        String email = request.getEmail().toLowerCase();

        if (examSession.getAccessMode() == ExamSession.AccessMode.WHITELIST) {
            boolean isWhitelisted = examSessionAccessRepository
                    .existsByExamSessionIdAndEmail(examSession.getId(), email);

            if (!isWhitelisted) {
                throw new ResponseException(BadRequestError.EMAIL_NOT_IN_WHITELIST);
            }
        }

        otpService.resendOtp(email, examSession);
    }

    @Override
    public GuestAccess validateSessionToken(String token) {

        String key = String.format(GUEST_TOKEN_KEY, token);
        String value = redisTemplate.opsForValue().get(key);

        if (value == null) {
            throw new ResponseException(BadRequestError.INVALID_SESSION_TOKEN);
        }

        String[] parts = value.split(":", 2);
        if (parts.length != 2) {
            throw new ResponseException(BadRequestError.INVALID_SESSION_TOKEN);
        }

        Long sessionId = Long.parseLong(parts[0]);
        String email = parts[1];

        long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        Instant expiresAt = ttl > 0
                ? Instant.now().plusSeconds(ttl)
                : Instant.now();

        return GuestAccess.builder()
                .sessionId(sessionId)
                .email(email)
                .expiresAt(expiresAt)
                .build();
    }

    /**
     *  Build join metadata
     * @param email - null khi join lần đầu (chưa verify OTP), có giá trị khi re-join (đã có token)
     */
    private JoinSessionMetaResponse buildJoinMeta(ExamSession session, String email) {
        if (Boolean.TRUE.equals(session.getDeleted())) {
            throw new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND);
        }

        if (session.getExamStatus() != ExamSession.ExamStatus.OPEN) {
            return this.buildCannotStartResponse(session, MessageConstants.SESSION_CLOSED);
        }

        Instant now = Instant.now();
        if (session.getStartTime() != null && now.isBefore(session.getStartTime())) {
            return buildCannotStartResponse(session, MessageConstants.SESSION_NOT_STARTED);
        }

        if (session.getEndTime() != null) {
            long lateJoinSeconds = (session.getLateJoinMinutes() != null ? session.getLateJoinMinutes() : 0) * 60L;
            Instant finalDeadline = session.getEndTime().plusSeconds(lateJoinSeconds);
            if (now.isAfter(finalDeadline)) {
                return buildCannotStartResponse(session, MessageConstants.SESSION_ENDED);
            }
        }

        // Not verify OTP → canStart = false
        if (email == null) {
            return JoinSessionMetaResponse.builder()
                    .sessionId(session.getId())
                    .sessionName(session.getName())
                    .examId(session.getExam() != null ? session.getExam().getId() : null)
                    .examName(session.getExam() != null ? session.getExam().getName() : null)
                    .durationMinutes(session.getDurationMinutes())
                    .attemptRemaining(session.getAttemptLimit())
                    .canStart(false)
                    .message("Please verify your email to start the exam")
                    .build();
        }

        //  verified
        int usedAttempts = examAttemptRepository.countByExamSessionIdAndStudentEmail(session.getId(), email);
        int remaining = session.getAttemptLimit() - usedAttempts;
        boolean canStart = remaining > 0;
        String message = canStart ? null : MessageConstants.ATTEMPT_LIMIT_REACHED;

        return JoinSessionMetaResponse.builder()
                .sessionId(session.getId())
                .sessionName(session.getName())
                .examId(session.getExam().getId())
                .examName(session.getExam().getName())
                .durationMinutes(session.getDurationMinutes())
                .attemptRemaining(Math.max(remaining, 0))
                .canStart(canStart)
                .message(message)
                .build();
    }

    private JoinSessionMetaResponse buildCannotStartResponse(ExamSession session, String message) {
        return JoinSessionMetaResponse.builder()
                .sessionId(session.getId())
                .sessionName(session.getName())
                .examId(session.getExam() != null ? session.getExam().getId() : null)
                .examName(session.getName() != null ? session.getName() : null)
                .durationMinutes(session.getDurationMinutes())
                .attemptRemaining(0)
                .canStart(Boolean.FALSE)
                .message(message)
                .build();
    }
}
