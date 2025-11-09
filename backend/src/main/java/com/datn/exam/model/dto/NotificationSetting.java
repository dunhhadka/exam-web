package com.datn.exam.model.dto;

import lombok.Data;

@Data
public class NotificationSetting {
    private Boolean sendResultEmail;
    private ReleasePolicy releasePolicy;

    public enum ReleasePolicy {
        IMMEDIATE,
        AFTER_EXAM_END,
        AFTER_MARKING
    }
}
