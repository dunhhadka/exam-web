package com.datn.exam.service.question.importfile;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ImportError {
    private Integer rowNumber;
    private String field;
    private String errorMessage;
}
