package com.datn.exam.model.dto.request;

import com.datn.exam.support.constants.ValidateConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RegisterRequest extends Request {

    @NotBlank(message = "Vui lòng nhập tên.")
    @Size(
            min = ValidateConstraint.Length.FIRST_NAME_MIN_LENGTH,
            max = ValidateConstraint.Length.FIRST_NAME_MAX_LENGTH,
            message = "Tên phải có độ dài từ 2 đến 50 ký tự."
    )
    @Pattern(
            regexp = ValidateConstraint.Format.FIRST_NAME_PATTERN,
            message = "Tên chỉ được chứa chữ cái, dấu nháy đơn, khoảng trắng hoặc dấu gạch nối."
    )
    private String firstName;

    @NotBlank(message = "Vui lòng nhập họ.")
    @Size(
            min = ValidateConstraint.Length.LAST_NAME_MIN_LENGTH,
            max = ValidateConstraint.Length.LAST_NAME_MAX_LENGTH,
            message = "Họ phải có độ dài từ 2 đến 50 ký tự."
    )
    @Pattern(
            regexp = ValidateConstraint.Format.LAST_NAME_PATTERN,
            message = "Họ chỉ được chứa chữ cái, dấu nháy đơn, khoảng trắng hoặc dấu gạch nối."
    )
    private String lastName;

    @NotBlank(message = "Vui lòng nhập email.")
    @Size(
            max = ValidateConstraint.Length.EMAIL_MAX_LENGTH,
            message = "Email không được vượt quá 50 ký tự."
    )
    @Pattern(
            regexp = ValidateConstraint.Format.EMAIL_PATTERN,
            message = "Email không đúng định dạng. Vui lòng kiểm tra lại."
    )
    private String email;

    @NotBlank(message = "Vui lòng nhập mật khẩu.")
    @Size(
            min = ValidateConstraint.Length.PASSWORD_MIN_LENGTH,
            max = ValidateConstraint.Length.PASSWORD_MAX_LENGTH,
            message = "Mật khẩu phải có độ dài từ 6 đến 50 ký tự."
    )
    @Pattern(
            regexp = ValidateConstraint.Format.PASSWORD_REGEX,
            message = "Mật khẩu không hợp lệ. Vui lòng nhập mật khẩu 8–99 ký tự, có ít nhất 1 chữ cái, 1 chữ số và 1 ký tự đặc biệt."
    )
    private String password;

    @NotBlank(message = "Vui lòng xác nhận mật khẩu.")
    @Size(
            min = ValidateConstraint.Length.PASSWORD_MIN_LENGTH,
            max = ValidateConstraint.Length.PASSWORD_MAX_LENGTH,
            message = "Mật khẩu xác nhận phải có độ dài từ 6 đến 50 ký tự."
    )
    @Pattern(
            regexp = ValidateConstraint.Format.PASSWORD_REGEX,
            message = "Mật khẩu xác nhận không hợp lệ. Vui lòng nhập mật khẩu 8–99 ký tự, có ít nhất 1 chữ cái, 1 chữ số và 1 ký tự đặc biệt."
    )
    private String confirmPassword;

    private boolean isTeacher;
}
