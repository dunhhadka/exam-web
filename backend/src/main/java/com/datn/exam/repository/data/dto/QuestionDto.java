package com.datn.exam.repository.data.dto;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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

    private String questionValue;

    private List<String> headers;

    private List<RowCompactDto> rows;

    private LocalDateTime createdAt;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String createdBy;

    @Getter
    @Setter
    public static class RowCompactDto {
        private String label;
        private Integer correctIndex;
    }
}
