package com.datn.exam.model.dto.response;

import com.datn.exam.model.entity.ExamAttempt;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptListResponse {
    private Long attemptId;
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
    private String ipAddress;

    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer wrongAnswers;
    private Integer unansweredQuestions;
}
