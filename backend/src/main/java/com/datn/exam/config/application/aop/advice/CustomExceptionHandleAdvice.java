package com.datn.exam.config.application.aop.advice;

import com.datn.exam.model.dto.response.ErrorResponse;
import com.datn.exam.support.enums.error.InternalServerError;
import com.datn.exam.support.enums.error.ResponseError;
import com.datn.exam.support.exception.ResponseException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
@Slf4j
@RequiredArgsConstructor
public class CustomExceptionHandleAdvice {

    @ExceptionHandler({ResponseException.class})
    public ResponseEntity<ErrorResponse<Object>> handleResponseException(ResponseException e, HttpServletRequest request) {
        ResponseError error = e.getError();

        log.warn("Failed to handle request {}: {}", request.getRequestURI(), e.getError().getMessage(), e);

        return ResponseEntity
                .status(error.getStatus())
                .body(
                        new ErrorResponse<>(
                                error.getCode(),
                                e.getFormattedMessage(),
                                error.getName()
                        )
                );
    }

    @ExceptionHandler({Exception.class})
    public ResponseEntity<ErrorResponse<Void>> handleResponseException(Exception e, HttpServletRequest request) {
        ResponseError error = InternalServerError.INTERNAL_SERVER_ERROR;

        log.error("Failed to handle request {}: {}", request.getRequestURI(), error.getMessage(), e);

        return ResponseEntity.status(error.getStatus()).body(
                new ErrorResponse<>(
                        error.getCode(),
                        error.getMessage(),
                        error.getName()
                )
        );
    }
}
