package com.datn.exam.model.dto.response;

import com.datn.exam.model.entity.Notification;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponse {

    private int id;

    private String content;

    private Notification.Type type;

    private String receivedId;

    private boolean isRead;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
