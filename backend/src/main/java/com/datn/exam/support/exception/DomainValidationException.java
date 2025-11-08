package com.datn.exam.support.exception;

import com.datn.exam.model.dto.response.InvalidFieldError;
import lombok.Getter;

import java.util.List;

@Getter
public class DomainValidationException extends RuntimeException{
    private final List<InvalidFieldError> fieldErrors;

    public DomainValidationException(List<InvalidFieldError> fieldErrors) {
        super("INPUT_VALID");
        this.fieldErrors = fieldErrors;
    }

    public DomainValidationException(InvalidFieldError fieldError) {
        super("INPUT_VALID");
        this.fieldErrors = List.of(fieldError);
    }
}
