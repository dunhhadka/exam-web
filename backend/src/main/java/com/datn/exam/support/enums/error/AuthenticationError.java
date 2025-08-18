package com.datn.exam.support.enums.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum AuthenticationError implements ResponseError{
    UNAUTHORIZED(401001, "Unauthorized"),
    INVALID_AUTHENTICATION_TOKEN(401002, "Invalid authentication token"),
    TOKEN_WAS_REVOKED(401003, "Token was revoked"),
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
        return 401;
    }

    @Override
    public int getCode() {
        return code;
    }
}
