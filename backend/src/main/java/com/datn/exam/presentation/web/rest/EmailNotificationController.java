package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.response.EmailNotificationResponse;
import com.datn.exam.model.dto.response.Response;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@RequestMapping("/api/email-notifications")
public interface EmailNotificationController {
    
    @GetMapping("/session/{sessionId}")
    Response<List<EmailNotificationResponse>> getEmailNotificationsBySession(@PathVariable Long sessionId);
}

