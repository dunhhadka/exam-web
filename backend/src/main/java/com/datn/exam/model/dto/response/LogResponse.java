package com.datn.exam.model.dto.response;

import com.datn.exam.model.entity.Log;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogResponse {
    private Long id;
    private Long attemptId;
    private Long sessionId;
    private String studentEmail;
    private String logType;
    private String severity;
    private String message;
    private String evidence;
    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss")
    private LocalDateTime loggedAt;
    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss")
    private LocalDateTime attemptStartedAt;
    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss")
    private LocalDateTime attemptSubmittedAt;

    public static LogResponse fromEntity(Log log) {
        return LogResponse.builder()
                .id(log.getId())
                .attemptId(log.getAttempt().getId())
                .sessionId(log.getAttempt().getExamSession().getId())
                .studentEmail(log.getAttempt().getStudentEmail())
                .logType(log.getLogType().name())
                .severity(log.getSeverity() != null ? log.getSeverity().name() : null)
                .message(log.getMessage())
                .evidence(log.getEvidence())
                .loggedAt(log.getLoggedAt())
                .attemptStartedAt(log.getAttempt().getStartedAt())
                .attemptSubmittedAt(log.getAttempt().getSubmittedAt())
                .build();
    }
}
