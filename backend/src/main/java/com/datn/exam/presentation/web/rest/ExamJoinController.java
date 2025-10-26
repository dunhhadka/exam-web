package com.datn.exam.presentation.web.rest;


import com.datn.exam.model.dto.request.JoinByCodeRequest;
import com.datn.exam.model.dto.request.JoinSessionMetaResponse;
import com.datn.exam.model.dto.request.OtpRequest;
import com.datn.exam.model.dto.request.VerifyOtpRequest;
import com.datn.exam.model.dto.response.GuestAccess;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.model.dto.response.SessionTokenResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api/join")
public interface ExamJoinController {

    @GetMapping("/{joinToken}")
    public Response<JoinSessionMetaResponse> joinByToken(@PathVariable String joinToken);

    @PostMapping("/by-code")
    public Response<JoinSessionMetaResponse> joinByCode(@Valid @RequestBody JoinByCodeRequest request);

    @PostMapping("/otp/request")
    public Response<Void> requestOtp(@Valid @RequestBody OtpRequest request);

    @PostMapping("/otp/verify")
    public Response<SessionTokenResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request);

    @PostMapping("/otp/resend")
    public Response<Void> resendOtp(@Valid @RequestBody OtpRequest request);

    @GetMapping("/token/validate")
    public Response<GuestAccess> validateSessionToken(@RequestHeader("X-Session-Token") String token);
}
