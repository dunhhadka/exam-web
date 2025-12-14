package com.datn.exam.model.dto.request;

import com.datn.exam.model.dto.ExamSessionSetting;
import com.datn.exam.model.entity.ExamSession;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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

    private ExamSession.AccessMode accessMode;
    
    // PRIVATE mode: List student IDs được assign vào session
    // (Lấy từ preview API sau khi import Excel)
    private List<java.util.UUID> studentIds;
    
    @Deprecated // Backward compatibility
    private String password;
    @Deprecated
    private List<String> whitelistEmails;
    @Deprecated
    private List<ExamSessionWhitelistEntryRequest> whitelistEntries;
}
