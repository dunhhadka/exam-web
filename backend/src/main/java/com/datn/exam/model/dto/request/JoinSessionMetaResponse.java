package com.datn.exam.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class JoinSessionMetaResponse {
    private Long sessionId;
    private String sessionName;
    private Long examId;
    private String examName;
    private Integer durationMinutes;
    private Integer attemptRemaining;
    private Boolean canStart;
    private String message;
}
