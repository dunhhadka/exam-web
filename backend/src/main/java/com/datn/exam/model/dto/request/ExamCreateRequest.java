package com.datn.exam.model.dto.request;

import com.datn.exam.model.dto.NotificationSetting;
import com.datn.exam.support.enums.Level;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
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

    @NotEmpty(message = "EXAM_QUESTIONS_REQUIRED")
    @Valid
    private List<QuestionRequest> questions;

    private List<Long> idsTag;

    @DecimalMin(value = "0.0", message = "EXAM_MIN_SCORE")
    private BigDecimal score;

    @JsonProperty("isPublic")
    private boolean isPublic;

    private NotificationSetting notificationSetting;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionRequest implements QuestionRequestInterface{
        @NotNull(message = "EXAM_QUESTION_ID_REQUIRED")
        private Long id;

        @NotNull(message = "EXAM_QUESTION_POINT_REQUIRED")
        private BigDecimal point;
    }
}
