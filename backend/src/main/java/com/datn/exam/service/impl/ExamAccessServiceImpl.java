package com.datn.exam.service.impl;

import com.datn.exam.model.dto.request.AccessOtpRequest;
import com.datn.exam.model.dto.request.VerifyOtpRequest;
import com.datn.exam.model.dto.response.AccessOtpInitResponse;
import com.datn.exam.model.dto.response.VerifyOtpResponse;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.repository.ExamSessionAccessRepository;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.service.ExamAccessService;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@RequiredArgsConstructor
@Service
@Slf4j
public class ExamAccessServiceImpl implements ExamAccessService {
    private final ExamSessionRepository examSessionRepository;
    private final ExamSessionAccessRepository examSessionAccessRepository;

    private static final int OTP_TTL_SECONDS = 300;
    private static final int MAX_RESEND = 5;
    private static final int MAX_FAIL = 5;
    private static final Duration RESEND_INTERVAL = Duration.ofSeconds(30);

    @Override
    public AccessOtpInitResponse requestOtp(AccessOtpRequest request) {
        ExamSession session = examSessionRepository.findByCode(request.getCode())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));


        return null;
    }

    @Override
    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        return null;
    }

    private void validateWindow(ExamSession session) {
        Instant now = Instant.now();

        if (session.getExamStatus() != ExamSession.ExamStatus.OPEN) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_CLOSED);
        }

        if (session.getStartTime() != null && now.isBefore(session.getStartTime())) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_STARTED);
        }

        if (session.getEndTime() != null && now.isAfter(session.getEndTime().plusSeconds(session.getLateJoinMinutes() * 60L))) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_ENDED);
        }
    }
}
