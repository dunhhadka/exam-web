package com.datn.exam.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VerifyOtpResponse {
    private Long sessionId;
    private String email;
    private String preAttemptToken;
    private int attemptRemaining;
}
