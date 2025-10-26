package com.datn.exam.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class GuestAccess {
    private Long sessionId;
    private String email;
    private Instant expiresAt;
}
