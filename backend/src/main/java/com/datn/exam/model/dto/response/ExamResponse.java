package com.datn.exam.model.dto.response;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class ExamResponse {
    private long id;
    private String title;
    private Level level;
    private List<ExamQuestion> examQuestion;
    private BigDecimal score;
    private boolean isPublic;
    private Status status;

    public static class ExamQuestion {
        private long id;
        private String text;
        private BigDecimal point; // current point
        private Level level;
        private List<TagResponse> tags;
        private QuestionType type;
    }
}
