package com.datn.exam.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinByCodeRequest {
    @NotBlank(message = "SESSION_CODE_REQUIRED")
    private String code;

}
