package com.datn.exam.support.enums.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum InternalServerError implements ResponseError {
    INTERNAL_SERVER_ERROR(500001, "Internal server error"),
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
        return 500;
    }

    @Override
    public int getCode() {
        return code;
    }
}
