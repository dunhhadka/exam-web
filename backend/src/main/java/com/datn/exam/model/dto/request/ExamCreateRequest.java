package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.Level;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class ExamCreateRequest extends Request{
    @NotBlank(message = "EXAM_NAME_REQUIRED")
    private String name;

    @NotNull(message = "EXAM_LEVEL_REQUIRED")
    private Level level;

    @NotNull(message = "EXAM_QUESTIONS_REQUIRED")
    @NotBlank(message = "EXAM_QUESTIONS_REQUIRED")
    @Valid
    private List<QuestionRequest> questions;

    @DecimalMin(value = "0.0", message = "EXAM_MIN_SCORE")
    private BigDecimal score;

    private boolean isPublic;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionRequest {
        private long id;

        @NotNull(message = "EXAM_QUESTION_POINT_REQUIRED")
        private BigDecimal point;
    }
}
