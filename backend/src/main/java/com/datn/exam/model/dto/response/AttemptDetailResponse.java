package com.datn.exam.model.dto.response;

import com.datn.exam.model.entity.ExamAttempt;
import com.datn.exam.support.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptDetailResponse {
    private Long attemptId;
    private Long sessionId;
    private String sessionName;
    private String examCode;
    private Integer attemptNo;
    private ExamAttempt.AttemptStatus status;
    private ExamAttempt.GradingStatus gradingStatus;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime expireAt;
    private BigDecimal scoreAuto;
    private BigDecimal scoreManual;
    private List<QuestionResponse> questions;
    private Map<String, Object> settings;

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
        private List<String> headers; // Cho TABLE_CHOICE
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
