package com.datn.exam.model.dto.response;

import com.datn.exam.model.entity.ExamSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionInfoResponse {
    private Long sessionId;
    private String sessionName;
    private ExamSession.AccessMode accessMode;
    private boolean isPrivate;
    private String examName;
    private java.util.Map<String, Object> settings; // Anti-cheat settings

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Integer duration;

    private String code;
}
