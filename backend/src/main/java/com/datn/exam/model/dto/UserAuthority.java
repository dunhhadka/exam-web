package com.datn.exam.model.dto;

import lombok.Builder;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Builder
public record UserAuthority(
        UUID userId,
        String email,
        List<String> roles,
        List<String> permissions
) {
    public List<String> grantedPrivileges() {
        List<String> combined = new ArrayList<>();

        if (roles != null) {
            roles.forEach(role -> combined.add("ROLE_" + role));
        }

        if (permissions != null) {
            combined.addAll(permissions);
        }
        return combined;
    }
}
