package com.datn.exam.model.dto.response;

import com.datn.exam.support.enums.ResponseStatus;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;

@Data
public class Response<T> implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    protected T data;
    private boolean success;
    private int code;
    private String message;
    private Instant timestamp = Instant.now();
    private String status;

    public static <T> Response<T> of(T data) {
        Response<T> response = new Response<>();

        response.data = data;
        response.success();

        return response;
    }

    public static <T> Response<T> ok() {
        Response<T> response = new Response<>();
        return response.success();
    }

    protected Response<T> success() {
        success = true;
        code = 200;
        status = ResponseStatus.SUCCESS.name();

        return this;
    }
}
