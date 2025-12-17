package com.datn.exam.service;

import com.datn.exam.model.dto.response.EmailNotificationResponse;

import java.util.List;

public interface EmailNotificationService {
    List<EmailNotificationResponse> getEmailNotificationsBySession(Long sessionId);
}

