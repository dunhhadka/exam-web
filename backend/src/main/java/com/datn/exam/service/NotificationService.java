package com.datn.exam.service;

import com.datn.exam.model.dto.response.CursorResponse;
import com.datn.exam.model.dto.response.NotificationResponse;
import com.datn.exam.model.dto.response.NotificationStatistic;
import com.datn.exam.model.entity.Notification;
import com.datn.exam.repository.data.NotificationRepository;
import com.datn.exam.support.util.ExceptionUtils;
import com.datn.exam.support.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public CursorResponse<NotificationResponse> search() {
        String currentUserId = SecurityUtils.getCurrentUserId().toString();

        var result = notificationRepository.findAllAndNotDeleted(currentUserId);

        return CursorResponse.<NotificationResponse>builder()
                .data(toResponses(result))
                .build();
    }

    private List<NotificationResponse> toResponses(List<Notification> result) {
        if (result.isEmpty()) {
            return List.of();
        }

        return result.stream()
                .map(this::toResponse)
                .toList();
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .content(notification.getContent())
                .type(notification.getType())
                .receivedId(notification.getReceiveId())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getLastModifiedAt())
                .build();
    }

    public void markRead(int notificationId) {
        var notification = findNotification(notificationId);

        notification.setRead(true);

        notificationRepository.save(notification);
    }

    private Notification findNotification(int notificationId) {
        var notification = notificationRepository.findByIdAndNotDeleted(notificationId);
        if (notification.isEmpty()) {
            throw ExceptionUtils.withMessage("Thông báo không tìm thấy hoặc đã bị xóa.");
        }

        return notification.get();
    }

    public void delete(int notificationId) {
        var notification = findNotification(notificationId);

        notification.setDeleted(true);

        notificationRepository.save(notification);
    }

    public void markAllRead() {
        var currentUserId = SecurityUtils.getCurrentUserId();
        Objects.requireNonNull(currentUserId);

        var notifications = notificationRepository
                .findByReceiveIdAndIsReadFalseAndNotDeleted(currentUserId.toString());
        if (notifications.isEmpty()) {
            return;
        }

        notifications.forEach(n -> n.setRead(true));

        notificationRepository.saveAll(notifications);
    }

    public NotificationStatistic statistic() {
        var currentUserId = SecurityUtils.getCurrentUserId();
        Objects.requireNonNull(currentUserId);

        return notificationRepository.statistic(currentUserId.toString());
    }
}
