package com.datn.exam.service.impl;

import com.datn.exam.model.dto.request.JoinByCodeRequest;
import com.datn.exam.model.dto.request.JoinSessionMetaResponse;
import com.datn.exam.model.dto.request.OtpRequest;
import com.datn.exam.model.dto.request.VerifyOtpRequest;
import com.datn.exam.model.dto.response.GuestAccess;
import com.datn.exam.model.dto.response.SessionInfoResponse;
import com.datn.exam.model.dto.response.SessionTokenResponse;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.repository.ExamAttemptRepository;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.repository.SessionStudentRepository;
import com.datn.exam.repository.UserRepository;
import com.datn.exam.service.ExamJoinService;
import com.datn.exam.service.OtpService;
import com.datn.exam.support.constants.MessageConstants;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
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
    private final UserRepository userRepository;
    private final SessionStudentRepository sessionStudentRepository;

    @Override
    @Transactional(readOnly = true)
    public SessionInfoResponse getSessionInfo(String code) {
        ExamSession session = examSessionRepository.findByCode(code)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        return SessionInfoResponse.builder()
                .sessionId(session.getId())
                .sessionName(session.getName())
                .accessMode(session.getAccessMode())
                .isPrivate(session.getAccessMode() == ExamSession.AccessMode.PRIVATE)
                .examName(session.getExam() != null ? session.getExam().getName() : null)
                .settings(session.getSettings())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .duration(session.getDurationMinutes())
                .code(session.getCode())
                .build();
    }

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

        if (Boolean.TRUE.equals(examSession.getDeleted())) {
            throw new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND);
        }

        if (examSession.getExamStatus() != ExamSession.ExamStatus.OPEN) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_CLOSED);
        }

        LocalDateTime now = LocalDateTime.now();
        if (examSession.getStartTime() != null && now.isBefore(examSession.getStartTime())) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_STARTED);
        }

        if (examSession.getEndTime() != null) {
            long lateJoinSeconds = (examSession.getLateJoinMinutes() != null ? examSession.getLateJoinMinutes() : 0)
                    * 60L;
            LocalDateTime finalDeadline = examSession.getEndTime().plusSeconds(lateJoinSeconds);
            if (now.isAfter(finalDeadline)) {
                throw new ResponseException(BadRequestError.EXAM_SESSION_ENDED);
            }
        }

        String email = request.getEmail().toLowerCase();

        // PRIVATE mode: Validate user phải là STUDENT và được assign vào session
        if (examSession.getAccessMode() == ExamSession.AccessMode.PRIVATE) {
            // Check user tồn tại với role STUDENT
            boolean isStudent = userRepository.existsStudentByEmail(email);
            if (!isStudent) {
                throw new ResponseException(BadRequestError.USER_NOT_STUDENT);
            }

            // Check student đã được assign vào session này chưa
            boolean isAssigned = sessionStudentRepository
                    .existsByExamSessionIdAndUserEmail(examSession.getId(), email);

            if (!isAssigned) {
                throw new ResponseException(BadRequestError.STUDENT_NOT_ASSIGNED_TO_SESSION);
            }
        }

        else {
            boolean existEmailTeacher = userRepository.existsTeacherByEmail(email);
            if (existEmailTeacher) {
                throw new ResponseException(BadRequestError.TEACHER_CANNOT_JOIN);
            }
        }

        int usedAttempts = examAttemptRepository.countCompletedAttempts(examSession.getId(), email);
        if (usedAttempts >= examSession.getAttemptLimit()) {
            throw new ResponseException(BadRequestError.ATTEMPT_LIMIT_REACHED);
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

        if (Boolean.TRUE.equals(examSession.getDeleted())) {
            throw new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND);
        }

        if (examSession.getExamStatus() != ExamSession.ExamStatus.OPEN) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_CLOSED);
        }

        LocalDateTime now = LocalDateTime.now();
        if (examSession.getStartTime() != null && now.isBefore(examSession.getStartTime())) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_STARTED);
        }

        if (examSession.getEndTime() != null) {
            long lateJoinSeconds = (examSession.getLateJoinMinutes() != null ? examSession.getLateJoinMinutes() : 0)
                    * 60L;
            LocalDateTime finalDeadline = examSession.getEndTime().plusSeconds(lateJoinSeconds);
            if (now.isAfter(finalDeadline)) {
                throw new ResponseException(BadRequestError.EXAM_SESSION_ENDED);
            }
        }

        String email = request.getEmail().toLowerCase();

        if (examSession.getAccessMode() == ExamSession.AccessMode.PRIVATE) {
            boolean isStudent = userRepository.existsStudentByEmail(email);
            if (!isStudent) {
                throw new ResponseException(BadRequestError.USER_NOT_STUDENT);
            }

            boolean isAssigned = sessionStudentRepository
                    .existsByExamSessionIdAndUserEmail(examSession.getId(), email);

            if (!isAssigned) {
                throw new ResponseException(BadRequestError.STUDENT_NOT_ASSIGNED_TO_SESSION);
            }
        } else {
            boolean existEmailTeacher = userRepository.existsTeacherByEmail(email);
            if (existEmailTeacher) {
                throw new ResponseException(BadRequestError.TEACHER_CANNOT_JOIN);
            }
        }

        int usedAttempts = examAttemptRepository.countByExamSessionIdAndStudentEmail(examSession.getId(), email);
        if (usedAttempts >= examSession.getAttemptLimit()) {
            throw new ResponseException(BadRequestError.ATTEMPT_LIMIT_REACHED);
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

    private JoinSessionMetaResponse buildJoinMeta(ExamSession session, String email) {
        if (Boolean.TRUE.equals(session.getDeleted())) {
            throw new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND);
        }

        if (session.getExamStatus() != ExamSession.ExamStatus.OPEN) {
            return this.buildCannotStartResponse(session, MessageConstants.SESSION_CLOSED);
        }

        LocalDateTime now = LocalDateTime.now();
        if (session.getStartTime() != null && now.isBefore(session.getStartTime())) {
            return buildCannotStartResponse(session, MessageConstants.SESSION_NOT_STARTED);
        }

        if (session.getEndTime() != null) {
            long lateJoinSeconds = (session.getLateJoinMinutes() != null ? session.getLateJoinMinutes() : 0) * 60L;
            LocalDateTime finalDeadline = session.getEndTime().plusSeconds(lateJoinSeconds);
            if (now.isAfter(finalDeadline)) {
                return buildCannotStartResponse(session, MessageConstants.SESSION_ENDED);
            }
        }

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
                .status(401)
                .build();
    }
}
