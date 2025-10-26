package com.datn.exam.model.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {

    @NotBlank(message = "SESSION_ID_REQUIRED")
    private String sessionCode;

    @Email(message = "EMAIL_INVALID")
    @NotBlank(message = "EMAIL_REQUIRED")
    private String email;

    @NotBlank(message = "OTP_REQUIRED")
    private String otp;
}
