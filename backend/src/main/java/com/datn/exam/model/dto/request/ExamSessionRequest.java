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
import java.util.Map;
import java.util.UUID;

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

    private List<UUID> studentIds;
    
    // Map userId -> List of base64 avatar images (only for new/changed avatars)
    private Map<UUID, List<String>> studentAvatars;
}
