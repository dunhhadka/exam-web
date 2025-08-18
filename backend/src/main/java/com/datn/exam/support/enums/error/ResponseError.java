package com.datn.exam.support.enums.error;

public interface ResponseError {
    String getName();

    String getMessage();

    int getStatus();

    default int getCode() {
        return 0;
    }
}
