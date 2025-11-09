package com.datn.exam.service;

import com.datn.exam.model.dto.request.JoinByCodeRequest;
import com.datn.exam.model.dto.request.JoinSessionMetaResponse;
import com.datn.exam.model.dto.request.OtpRequest;
import com.datn.exam.model.dto.request.VerifyOtpRequest;
import com.datn.exam.model.dto.response.GuestAccess;
import com.datn.exam.model.dto.response.SessionInfoResponse;
import com.datn.exam.model.dto.response.SessionTokenResponse;

public interface ExamJoinService {
    SessionInfoResponse getSessionInfo(String code);
    
    JoinSessionMetaResponse joinByToken(String joinToken);

    JoinSessionMetaResponse joinByCode(JoinByCodeRequest request);

    void requestOtp(OtpRequest request);

    SessionTokenResponse verifyOtp(VerifyOtpRequest request);

    void resendOtp(OtpRequest request);

    GuestAccess validateSessionToken(String token);
}
