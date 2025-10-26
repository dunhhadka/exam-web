package com.datn.exam.model.dto.response;

import com.datn.exam.model.entity.ExamAttempt;
import com.datn.exam.support.enums.QuestionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class AttemptDetailResponse {
    private Long attemptId;
    private Long sessionId;
    private String sessionName;
    private Integer attemptNo;
    private ExamAttempt.AttemptStatus status;
    private ExamAttempt.GradingStatus gradingStatus;
    private Instant startedAt;
    private Instant submittedAt;
    private Instant expireAt;
    private BigDecimal scoreAuto;
    private BigDecimal scoreManual;
    private List<QuestionResponse> questions;

    @Data
    @Builder
    public static class QuestionResponse {
        private Long attemptQuestionId;
        private Integer orderIndex;
        private QuestionType type;
        private BigDecimal point;

        private String text;
        private List<AnswerResponse> answers;

        private Integer minWords;
        private Integer maxWords;
        private List<TableRow> rows;
    }

    @Data
    @Builder
    public static class AnswerResponse {
        private Long answerId;
        private String value;
    }

    @Data
    @Builder
    public static class TableRow {
        private String label;
        private List<String> columns;
    }
}
