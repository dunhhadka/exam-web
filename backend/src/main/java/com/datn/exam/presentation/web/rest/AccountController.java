package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.RegisterRequest;
import com.datn.exam.model.dto.response.Response;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api/account")
public interface AccountController {

    @PostMapping("/register")
    Response<Boolean> register(@Valid @RequestBody RegisterRequest request);
}
