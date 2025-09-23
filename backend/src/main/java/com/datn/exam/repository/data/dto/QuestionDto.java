package com.datn.exam.repository.data.dto;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class QuestionDto {
    private long id;
    private String text;
    private BigDecimal point;
    private QuestionType type;
    private Level level;
    private Status status;

    private boolean publicFlag;

    private LocalDateTime createdAt;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String createdBy;
}
