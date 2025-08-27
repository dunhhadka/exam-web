package com.datn.exam.model.dto.request;

import com.datn.exam.support.constants.ValidateConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class AuthenticateRequest extends Request{
    @NotBlank(message = "CREDENTIAL_REQUIRED")
    private String credential;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(
            min = ValidateConstraint.Length.PASSWORD_MIN_LENGTH,
            max = ValidateConstraint.Length.PASSWORD_MAX_LENGTH,
            message = "PASSWORD_LENGTH"
    )
    private String password;

    private Boolean rememberMe;
}
