package com.datn.exam.service;

import com.datn.exam.model.dto.request.AccessOtpRequest;
import com.datn.exam.model.dto.request.VerifyOtpRequest;
import com.datn.exam.model.dto.response.AccessOtpInitResponse;
import com.datn.exam.model.dto.response.VerifyOtpResponse;

public interface ExamAccessService {
    AccessOtpInitResponse requestOtp(AccessOtpRequest request);
    VerifyOtpResponse verifyOtp(VerifyOtpRequest request);
}
