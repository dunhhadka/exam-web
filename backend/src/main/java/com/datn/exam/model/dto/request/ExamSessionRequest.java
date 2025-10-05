package com.datn.exam.model.dto.request;

import com.datn.exam.model.dto.ExamSessionSetting;
import com.datn.exam.model.dto.mapper.InstantCustomDeserializer;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class ExamSessionRequest {
    private Long examId;
    private String name;

    @JsonDeserialize(using = InstantCustomDeserializer.class)
    private Instant startTime;
    @JsonDeserialize(using = InstantCustomDeserializer.class)
    private Instant endTime;

    private Integer durationMinutes;

    private Integer lateJoinMinutes;
    private boolean shuffleQuestion;
    private boolean shuffleAnswers;

    private Integer attemptLimit;

    @JsonProperty("isPublic")
    private boolean isPublic;

    private ExamSessionSetting settings;

}
