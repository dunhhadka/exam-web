package com.datn.exam.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class RefreshTokenRequest extends Request{
    @NotBlank(message = "REFRESH_TOKEN_REQUIRED")
    private String refreshToken;

    private Boolean rememberMe;
}
