package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.StartAttemptRequest;
import com.datn.exam.model.dto.request.SubmitAttemptRequest;
import com.datn.exam.model.dto.response.AttemptDetailResponse;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.ExamAttemptController;
import com.datn.exam.service.ExamAttemptService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ExamAttemptControllerImpl implements ExamAttemptController {
    private final ExamAttemptService examAttemptService;

    @Override
    public Response<AttemptDetailResponse> startAttempt(
            StartAttemptRequest request,
            HttpServletRequest servletRequest
    ) {
        String headerToken = servletRequest.getHeader("X-Session-Token");
        if (headerToken != null && !headerToken.isBlank()) {
            request.setSessionToken(headerToken);
        }

        String ipAddress = servletRequest.getRemoteAddr();
        request.setIpAddress(ipAddress);

        AttemptDetailResponse response = examAttemptService.startAttempt(request);
        return Response.of(response);
    }

    @Override
    public Response<AttemptDetailResponse> submitAttempt(
            Long attemptId,
            SubmitAttemptRequest request,
            String sessionToken
    ) {
        AttemptDetailResponse response = examAttemptService.submitAttempt(attemptId, request, sessionToken);
        return Response.of(response);
    }

    @Override
    public Response<AttemptDetailResponse> getCurrentAttempt(Long sessionId) {
        return null;
    }
}
