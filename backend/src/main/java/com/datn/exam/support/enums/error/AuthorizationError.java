package com.datn.exam.support.enums.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum AuthorizationError implements ResponseError{
    UNAUTHORIZED(403000, "Chưa xác thực"),
    ACCESS_DENIED(403001, "Access denied"),
    FORBIDDEN(403002, "Không có quyền truy cập"),
    UNSUPPORTED_AUTHENTICATION(403003, "Unsupported authentication")
    ;

    private final int code;
    private final String message;

    @Override
    public String getName() {
        return name();
    }

    @Override
    public String getMessage() {
        return message;
    }

    @Override
    public int getStatus() {
        return 403;
    }

    @Override
    public int getCode() {
        return code;
    }
}