package com.datn.exam.model.dto.response;

import com.datn.exam.model.entity.ExamSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionInfoResponse {
    private Long sessionId;
    private String sessionName;
    private ExamSession.AccessMode accessMode;
    private boolean requiresPassword;
    private boolean requiresWhitelist;
    private String examName;
}
