package com.datn.exam.service;

import com.datn.exam.model.dto.request.RegisterRequest;

public interface AccountService {
    void register(RegisterRequest request);
}
