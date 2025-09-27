package com.datn.exam.config.application.aop.advice;


import com.datn.exam.model.dto.response.ErrorResponse;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.model.dto.response.InvalidInputResponse;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.InternalServerError;
import com.datn.exam.support.enums.error.ResponseError;
import com.datn.exam.support.exception.DomainValidationException;
import com.datn.exam.support.exception.ResponseException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@ControllerAdvice
@Slf4j
@RequiredArgsConstructor
public class CustomExceptionHandleAdvice {

    @ExceptionHandler({DomainValidationException.class})
    public ResponseEntity<InvalidInputResponse> handleDomainValidation(DomainValidationException ex, HttpServletRequest request) {
        var fieldErrors = ex.getFieldErrors().stream()
                .map(err -> {
                    String messageCode = err.getMessage();
                    String message = resolveBadRequestMessage(messageCode);
                    return InvalidFieldError.builder()
                            .field(err.getField())
                            .objectName(err.getObjectName())
                            .message(message)
                            .build();
                })
                .toList();

        String topMessage = fieldErrors.isEmpty()
                ? "INPUT_INVALID"
                : fieldErrors.stream().map(InvalidFieldError::getMessage)
                .distinct().collect(Collectors.joining(", "));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new InvalidInputResponse(
                        HttpStatus.BAD_REQUEST.value(),
                        topMessage,
                        "INPUT_INVALID",
                        fieldErrors
                ));
    }

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

    @ExceptionHandler({MethodArgumentNotValidException.class})
    public ResponseEntity<InvalidInputResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException e, HttpServletRequest request) {
        BindingResult bindingResult = e.getBindingResult();

        final String DEFAULT_INPUT_INVALID_CODE = "INPUT_INVALID";

        List<InvalidFieldError> fieldErrors = bindingResult.getFieldErrors().stream()
                .map(fieldError -> {
                    String messageCode = Optional.ofNullable(fieldError.getDefaultMessage()).orElse(DEFAULT_INPUT_INVALID_CODE);
                    String message = resolveBadRequestMessage(messageCode); // map sang message enum
                    return InvalidFieldError.builder()
                            .field(fieldError.getField())
                            .objectName(fieldError.getObjectName())
                            .message(message)
                            .build();
                })
                .toList();


        String topMessage = fieldErrors.isEmpty()
                ? DEFAULT_INPUT_INVALID_CODE
                : fieldErrors.stream().map(InvalidFieldError::getMessage).distinct().collect(Collectors.joining("; "));

        log.warn("Failed to handle request {}: {}", request.getRequestURI(), e.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        new InvalidInputResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                topMessage,
                                DEFAULT_INPUT_INVALID_CODE,
                                fieldErrors
                        )
                );
    }


    @ExceptionHandler({ConstraintViolationException.class})
    public ResponseEntity<InvalidInputResponse> handleValidationException(ConstraintViolationException e, HttpServletRequest request) {
        final String DEFAULT_INPUT_INVALID_CODE = "INPUT_INVALID";

        List<InvalidFieldError> fieldErrors = e.getConstraintViolations().stream()
                .map(cv -> {
                    String propertyPath = cv.getPropertyPath().toString();
                    String propertyName = propertyPath.contains(".")
                            ? propertyPath.substring(propertyPath.lastIndexOf('.') + 1)
                            : propertyPath;
                    String objectName = propertyPath.contains(".")
                            ? propertyPath.substring(0, propertyPath.indexOf('.'))
                            : propertyPath;

                    String messageCode = cv.getMessage(); // annotation message là code
                    String message = resolveBadRequestMessage(messageCode);

                    return InvalidFieldError.builder()
                            .field(propertyName)
                            .objectName(objectName)
                            .message(message) // <- dùng message từ BadRequestError
                            .build();
                })
                .toList();

        log.warn("Failed to handle request {}: {}", request.getRequestURI(), e.getMessage(), e);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        new InvalidInputResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                DEFAULT_INPUT_INVALID_CODE,
                                DEFAULT_INPUT_INVALID_CODE,
                                fieldErrors)
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

    private String resolveBadRequestMessage(String code) {
        if (code == null) return "INPUT_INVALID";

        try {
            return BadRequestError.valueOf(code).getMessage();
        } catch (IllegalArgumentException e) {
            return code;
        }
    }
}
