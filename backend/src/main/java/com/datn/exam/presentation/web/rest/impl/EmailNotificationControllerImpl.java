package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.response.EmailNotificationResponse;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.EmailNotificationController;
import com.datn.exam.service.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EmailNotificationControllerImpl implements EmailNotificationController {
    private final EmailNotificationService emailNotificationService;

    @Override
    public Response<List<EmailNotificationResponse>> getEmailNotificationsBySession(Long sessionId) {
        List<EmailNotificationResponse> emails = emailNotificationService.getEmailNotificationsBySession(sessionId);
        return Response.of(emails);
    }
}

