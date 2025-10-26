package com.datn.exam.service.impl;

import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.service.MailPersistenceService;
import com.datn.exam.service.OtpService;
import com.datn.exam.support.constants.MailVariableConstants;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.OtpUtils;
import com.datn.exam.support.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private static final String OTP_KEY = "exam:otp:%s:%d";
    private static final String OTP_SALT_KEY = "exam:otp:salt:%s:%d";
    private static final int DEFAULT_EXPIRES_MINUTES = 5;

    private final RedisTemplate<String, String> redisTemplate;
    private final MailPersistenceService persistenceService;

    @SuppressWarnings("OptionalOfNullableMisuse")
    @Override
    public void sendOtp(String email, ExamSession examSession) {
        String otpKey = buildKey(email, examSession.getId());

        long ttl = Optional.ofNullable(redisTemplate.getExpire(otpKey, TimeUnit.SECONDS)).orElse(0L);
        if (ttl > 0) {
            throw new ResponseException(BadRequestError.OTP_STILL_VALID, String.valueOf(ttl));
        }

        generateAndSendNewOtp(email, examSession);
    }

    @Override
    public boolean verifyOtp(String email, Long sessionId, String rawOtp) {
        String otpKey = buildKey(email, sessionId);
        String saltKey = buildSaltKey(email, sessionId);

        String hash = redisTemplate.opsForValue().get(otpKey);
        String salt = redisTemplate.opsForValue().get(saltKey);

        if (hash == null || salt == null) {
            log.warn("OTP expired or not found for email={}, sessionId={}", email, sessionId);
            return false;
        }
        boolean valid = OtpUtils.matches(rawOtp, salt, hash);

        if (valid) {
            redisTemplate.delete(otpKey);
            redisTemplate.delete(saltKey);
        } else {
            log.warn("Invalid OTP for email={}, sessionId={}", email, sessionId);
        }

        return valid;
    }

    @SuppressWarnings("OptionalOfNullableMisuse")
    @Override
    public void resendOtp(String email, ExamSession examSession) {
        String otpKey = buildKey(email, examSession.getId());

        long ttl = Optional.ofNullable(redisTemplate.getExpire(otpKey, TimeUnit.SECONDS)).orElse(0L);

        if (ttl > (DEFAULT_EXPIRES_MINUTES * 60) - 60) {
            long waitTime = ttl - ((DEFAULT_EXPIRES_MINUTES * 60) - 60);
            throw new ResponseException(BadRequestError.OTP_RESEND_TOO_EARLY, String.valueOf(waitTime));
        }

        generateAndSendNewOtp(email, examSession);
    }

    private void generateAndSendNewOtp(String email, ExamSession examSession) {
        String otpKey = buildKey(email, examSession.getId());
        String saltKey = buildSaltKey(email, examSession.getId());

        String otp = OtpUtils.generate6();
        String salt = OtpUtils.randomSalt(16);
        String hash = OtpUtils.hash(otp, salt);

        redisTemplate.opsForValue().set(otpKey, hash, DEFAULT_EXPIRES_MINUTES, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set(saltKey, salt, DEFAULT_EXPIRES_MINUTES, TimeUnit.MINUTES);

        persistenceService.createMail(
                email,
                StringUtils.buildSubject(examSession.getCode()),
                otp,
                MailVariableConstants.EXAM_OTP_MAIL_TEMPLATE,
                DEFAULT_EXPIRES_MINUTES,
                examSession.getDurationMinutes(),
                examSession.getLateJoinMinutes()
        );
    }

    private String buildKey(String email, Long sessionId) {
        return String.format(OTP_KEY, email.toLowerCase(), sessionId);
    }

    private String buildSaltKey(String email, Long sessionId) {
        return String.format(OTP_SALT_KEY, email.toLowerCase(), sessionId);
    }
}
