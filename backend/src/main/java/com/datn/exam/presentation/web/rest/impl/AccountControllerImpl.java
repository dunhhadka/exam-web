package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.RegisterRequest;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.AccountController;
import com.datn.exam.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AccountControllerImpl implements AccountController {
    private final AccountService accountService;

    @Override
    public Response<Boolean> register(RegisterRequest request) {
        accountService.register(request);
        return Response.ok();
    }
}
