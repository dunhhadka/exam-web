package com.datn.exam.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualGradingRequest {
    private List<QuestionGrading> questions;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionGrading {
        private Long attemptQuestionId;
        private BigDecimal score;
        private String feedback;
    }
}
