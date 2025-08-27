package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.AuthenticateRequest;
import com.datn.exam.model.dto.request.RegisterRequest;
import com.datn.exam.model.dto.response.AuthenticateResponse;
import com.datn.exam.model.dto.response.ProfileResponse;
import com.datn.exam.model.dto.response.Response;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api/account")
public interface AccountController {

    @PostMapping("/register")
    Response<Boolean> register(@Valid @RequestBody RegisterRequest request);

    @PostMapping("/authenticate")
    Response<AuthenticateResponse> login(@Valid @RequestBody AuthenticateRequest request);

    @GetMapping("/profile")
    Response<ProfileResponse> getAccountProfile();
}
