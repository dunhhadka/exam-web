package com.datn.exam.model.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AccessOtpRequest {

    @NotBlank(message = "SESSION_CODE_REQUIRED")
    private String code;

    @Email(message = "EMAIL_INVALID")
    @NotBlank(message = "EMAIL_REQUIRED")
    private String email;
}
