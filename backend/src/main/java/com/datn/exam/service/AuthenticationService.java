package com.datn.exam.service;

import com.datn.exam.model.dto.UserAuthority;

import java.util.UUID;

public interface AuthenticationService {
    UserAuthority getUserAuthority(UUID id);
}
