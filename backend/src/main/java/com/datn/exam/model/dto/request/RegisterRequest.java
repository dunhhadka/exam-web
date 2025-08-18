package com.datn.exam.model.dto.request;

import com.datn.exam.support.constants.ValidateConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RegisterRequest extends Request{

    @NotBlank(message = "LAST_NAME_REQUIRED")
    @Size(
            min = ValidateConstraint.Length.FIRST_NAME_MIN_LENGTH,
            max = ValidateConstraint.Length.FIRST_NAME_MAX_LENGTH,
            message = "FIRST_NAME_LENGTH"
    )
    @Pattern(regexp = ValidateConstraint.Format.FIRST_NAME_PATTERN)
    private String firstName;

    @NotBlank(message = "LAST_NAME_REQUIRED")
    @Size(
            min = ValidateConstraint.Length.LAST_NAME_MIN_LENGTH,
            max = ValidateConstraint.Length.LAST_NAME_MAX_LENGTH,
            message = "LAST_NAME_LENGTH"
    )
    @Pattern(regexp = ValidateConstraint.Format.LAST_NAME_PATTERN)
    private String lastName;

    @NotBlank(message = "EMAIL_REQUIRED")
    @Size(max = ValidateConstraint.Length.EMAIL_MAX_LENGTH, message = "EMAIL_LENGTH")
    @Pattern(regexp = ValidateConstraint.Format.EMAIL_PATTERN, message = "EMAIL_FORMAT")
    private String email;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(
            min = ValidateConstraint.Length.PASSWORD_MIN_LENGTH,
            max = ValidateConstraint.Length.PASSWORD_MAX_LENGTH,
            message = "PASSWORD_LENGTH"
    )
    @Pattern(
            regexp = ValidateConstraint.Format.PASSWORD_REGEX,
            message = "PASSWORD_FORMAT"
    )
    private String password;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(
            min = ValidateConstraint.Length.PASSWORD_MIN_LENGTH,
            max = ValidateConstraint.Length.PASSWORD_MAX_LENGTH,
            message = "PASSWORD_LENGTH"
    )
    @Pattern(
            regexp = ValidateConstraint.Format.PASSWORD_REGEX,
            message = "PASSWORD_FORMAT"
    )
    private String confirmPassword;

    private boolean isTeacher;
}
