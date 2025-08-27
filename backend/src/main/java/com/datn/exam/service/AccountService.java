package com.datn.exam.service;

import com.datn.exam.model.dto.request.AuthenticateRequest;
import com.datn.exam.model.dto.request.RefreshTokenRequest;
import com.datn.exam.model.dto.response.AuthenticateResponse;
import com.datn.exam.model.dto.request.RegisterRequest;
import com.datn.exam.model.dto.response.ProfileResponse;

import java.util.UUID;

public interface AccountService {
    void register(RegisterRequest request);
    AuthenticateResponse login(AuthenticateRequest request);
    void activeAccount();
    void activeAccount(UUID id);
    AuthenticateResponse refreshToken(RefreshTokenRequest request);
    ProfileResponse getAccountProfile();
}
