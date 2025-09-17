package com.datn.exam.support.exception;

import com.datn.exam.support.enums.error.ResponseError;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ResponseException extends RuntimeException{
    private final ResponseError error;
    private final Object[] messageArgs;

    public ResponseException(ResponseError error) {
        super(error.getMessage());
        this.error = error;
        this.messageArgs = null;
    }

    public ResponseException(ResponseError error, Object... messageArgs) {
        super(error.getMessage());
        this.error = error;
        this.messageArgs = messageArgs;
    }

    public String getFormattedMessage() {
        if (messageArgs == null || messageArgs.length == 0) {
            return error.getMessage();
        }

        return String.format(error.getMessage(), messageArgs);
    }
}
