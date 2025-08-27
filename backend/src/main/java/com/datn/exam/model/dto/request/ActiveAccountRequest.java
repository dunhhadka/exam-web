package com.datn.exam.model.dto.request;

import com.datn.exam.model.dto.response.AuthenticateResponse;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ActiveAccountRequest extends Request{
    @NotBlank(message = "CREDENTIAL_REQUIRED")
    private String credential;
    @NotBlank(message = "ACTIVATION_CODE_REQUIRED")
    private String activationCode;
}
