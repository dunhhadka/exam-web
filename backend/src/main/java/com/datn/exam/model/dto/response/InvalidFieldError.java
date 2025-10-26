package com.datn.exam.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.io.Serializable;

@Data
@Builder
@AllArgsConstructor
public class InvalidFieldError implements Serializable {
    private String field;
    private String objectName;
    private String message;
}
