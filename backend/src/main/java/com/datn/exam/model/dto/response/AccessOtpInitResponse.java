package com.datn.exam.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccessOtpInitResponse {
    private Long sessionId;

    private String email;

    private int expiresInSeconds;

    private int resendRemaining;
}
