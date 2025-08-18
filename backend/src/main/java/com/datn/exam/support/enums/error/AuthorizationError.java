package com.datn.exam.support.enums.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum AuthorizationError implements ResponseError{
    ACCESS_DENIED(403001, "Access denied"),
    UNSUPPORTED_AUTHENTICATION(403002, "Unsupported authentication"),
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