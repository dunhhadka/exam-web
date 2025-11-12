package com.datn.exam.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhitelistPreviewResponse {
    private Long sessionId;
    private String sessionName;

    private List<EmailItem> validEmails;
    private List<EmailItem> invalidEmails;
    private List<EmailItem> duplicates;

    private int totalValid;
    private int totalInvalid;
    private int totalDuplicates;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailItem {
        private Integer row;
        private String email;
        private List<String> avatarPreviews;
        private Integer avatarCount;
        private Boolean hasAvatars;
        private String reason;
    }
}
