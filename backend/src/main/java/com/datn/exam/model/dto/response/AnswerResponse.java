package com.datn.exam.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class AnswerResponse {
    private long id;
    private Integer orderIndex;
    private String value;
    private Boolean result;
    private String explanation;
    private String explanationHtml;
    private List<MediaContentResponse> mediaContents;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
