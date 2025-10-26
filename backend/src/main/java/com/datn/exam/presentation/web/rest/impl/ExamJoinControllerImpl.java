package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.JoinByCodeRequest;
import com.datn.exam.model.dto.request.JoinSessionMetaResponse;
import com.datn.exam.model.dto.request.OtpRequest;
import com.datn.exam.model.dto.request.VerifyOtpRequest;
import com.datn.exam.model.dto.response.GuestAccess;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.model.dto.response.SessionTokenResponse;
import com.datn.exam.presentation.web.rest.ExamJoinController;
import com.datn.exam.service.ExamJoinService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ExamJoinControllerImpl implements ExamJoinController {
    private final ExamJoinService examJoinService;

    @Override
    public Response<JoinSessionMetaResponse> joinByToken(String joinToken) {
        return Response.of(examJoinService.joinByToken(joinToken));
    }

    @Override
    public Response<JoinSessionMetaResponse> joinByCode(JoinByCodeRequest request) {
        return Response.of(examJoinService.joinByCode(request));
    }

    @Override
    public Response<Void> requestOtp(OtpRequest request) {
        examJoinService.requestOtp(request);
        return Response.ok();
    }

    @Override
    public Response<SessionTokenResponse> verifyOtp(VerifyOtpRequest request) {
        return Response.of(examJoinService.verifyOtp(request));
    }

    @Override
    public Response<Void> resendOtp(OtpRequest request) {
        examJoinService.resendOtp(request);
        return Response.ok();
    }

    @Override
    public Response<GuestAccess> validateSessionToken(String token) {
        return Response.of(examJoinService.validateSessionToken(token));
    }
}
