package com.datn.exam.service;

import com.datn.exam.model.entity.ExamSession;

public interface OtpService {
    void sendOtp(String email, ExamSession examSession);

    boolean verifyOtp(String email, Long sessionId, String rawOtp);

    void resendOtp(String email, ExamSession examSession);
}
