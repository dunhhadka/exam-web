package com.datn.exam.support.util;

import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.support.exception.DomainValidationException;

public class ExceptionUtils {

    public static DomainValidationException withMessage(String message) {
        return new DomainValidationException(InvalidFieldError.builder()
                .message(message)
                .build());
    }

}
