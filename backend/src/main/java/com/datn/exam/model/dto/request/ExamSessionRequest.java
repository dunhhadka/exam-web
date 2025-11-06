package com.datn.exam.model.dto.request;

import com.datn.exam.model.dto.ExamSessionSetting;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExamSessionRequest {
    private Long examId;
    private String name;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer durationMinutes;

    private Integer lateJoinMinutes;
    private boolean shuffleQuestion;
    private boolean shuffleAnswers;

    private Integer attemptLimit;

    @JsonProperty("isPublic")
    private boolean isPublic;

    private ExamSessionSetting settings;

}
