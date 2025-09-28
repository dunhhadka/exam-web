package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.Level;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class ExamUpdateRequest extends Request{

    @NotBlank(message = "EXAM_NAME_REQUIRED")
    private String name;

    @NotNull(message = "EXAM_LEVEL_REQUIRED")
    private Level level;

    @NotEmpty(message = "EXAM_QUESTIONS_REQUIRED")
    @Valid
    private List<ExamCreateRequest.QuestionRequest> questions;

    private List<Long> idsTag;

    @DecimalMin(value = "0.0", message = "EXAM_MIN_SCORE")
    private BigDecimal score;

    @JsonProperty("isPublic")
    private boolean isPublic;
}
