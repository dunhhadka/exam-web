package com.datn.exam.model.dto.response;

import lombok.Data;

@Data
public class ExamSessionMetaResponse {
    private Long sessionId;
    private Long examId;
    private String name;
    private Integer durationMinutes;
    private boolean canStart;
}
