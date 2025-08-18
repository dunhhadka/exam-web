package com.datn.exam.model.dto;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder
public record UserAuthority(
        UUID userId,
        String username,
        List<String> grantedPrivileges
) {
}
