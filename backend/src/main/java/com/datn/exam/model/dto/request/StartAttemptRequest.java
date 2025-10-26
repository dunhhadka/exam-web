package com.datn.exam.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StartAttemptRequest {
    @NotNull(message = "EXAM_SESSION_ID_REQUIRED")
    private Long sessionId;

    private String sessionToken;

    private String email;

    private String name; // name's user

    private String ipAddress;
}
