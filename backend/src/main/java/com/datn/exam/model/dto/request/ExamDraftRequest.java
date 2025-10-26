package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.Level;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
public class ExamDraftRequest extends Request{
    @NotBlank(message = "name must be not null")
    private String name;
    private Level level;

    private List<Long> idsTag;

    private List<ExamCreateRequest.QuestionRequest> questionIds;

    private BigDecimal score;

    @JsonProperty("isPublic")
    private boolean isPublic;

    private List<ExamDraftRequest.QuestionRequest> questions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionRequest implements QuestionRequestInterface{
        private Long id;

        private BigDecimal point;
    }
}
