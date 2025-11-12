package com.datn.exam.model.dto.response;

import com.datn.exam.model.entity.ExamAttempt;
import com.datn.exam.support.enums.QuestionType;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptGradingResponse {
    private Long attemptId;
    private Long sessionId;
    private String sessionName;
    private String studentEmail;
    private String studentName;
    private Integer attemptNo;
    private ExamAttempt.AttemptStatus status;
    private ExamAttempt.GradingStatus gradingStatus;

    private LocalDateTime startedAt;

    private LocalDateTime submittedAt;

    private BigDecimal scoreAuto;
    private BigDecimal scoreManual;
    private BigDecimal totalScore;
    private List<QuestionGradingDetail> questions;

    @Data
    @Builder
    public static class QuestionGradingDetail {
        private Long attemptQuestionId;
        private Long questionId;
        private Integer orderIndex;
        private QuestionType type;
        private BigDecimal point;
        private String text;

        private Map<String, Object> questionSnapshot;

        private Map<String, Object> studentAnswer;

        private BigDecimal autoScore;
        private BigDecimal manualScore;
        private Boolean correct;

        private List<AnswerDetail> answers; // Cho ONE/MULTI_CHOICE
        private List<String> tableHeaders; // Cho TABLE_CHOICE
        private List<TableRowDetail> rows; // Cho TABLE_CHOICE
        private String expectedAnswer; // Cho PLAIN_TEXT
        private Integer minWords; // Cho ESSAY
        private Integer maxWords;
    }

    @Data
    @Builder
    public static class AnswerDetail {
        private Long answerId;
        private String value;
        private Boolean result;
        private Boolean selected;
    }

    @Data
    @Builder
    public static class TableRowDetail {
        private String label;
        private List<String> columns;
        private Integer correctIndex;
        private Integer selectedIndex;
    }
}
