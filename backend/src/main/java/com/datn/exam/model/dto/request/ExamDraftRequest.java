package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.Level;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class ExamDraftRequest extends Request{
    private String name;
    private Level level;

    private List<ExamCreateRequest.QuestionRequest> questionIds;

    private BigDecimal score;

    private Boolean isPublic;

    public static class QuestionRequest {
        private Long id;
        private BigDecimal point;
    }
}
