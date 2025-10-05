package com.datn.exam.model.dto.response;

import com.datn.exam.model.dto.ExamSessionSetting;
import com.datn.exam.model.entity.ExamSession;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class ExamSessionResponse {
    private Long id;
    private ExamResponse exam;
    private String name;
    private String code;
    private String joinToken;
    private String joinPath; // "/join/{token}"
    private ExamSession.ExamStatus status;

    private Instant startTime;
    private Instant endTime;
    private Integer durationMinutes;
    private Integer lateJoinMinutes;

    private boolean shuffleQuestion;
    private boolean shuffleAnswers;
    @JsonProperty("isPublic")
    private boolean publicFlag;
    private Integer attemptLimit;

    private ExamSessionSetting settings;
}
