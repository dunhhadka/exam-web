package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.response.NotificationStatistic;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.NotificationController;
import com.datn.exam.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class NotificationControllerImpl implements NotificationController {

    private final NotificationService notificationService;

    @Override
    public Response<?> search() {
        return Response.of(notificationService.search());
    }

    @Override
    public Response<Void> markRead(int notificationId) {
        notificationService.markRead(notificationId);
        return Response.ok();
    }

    @Override
    public Response<Void> delete(int notificationId) {
        notificationService.delete(notificationId);
        return Response.ok();
    }

    @Override
    public Response<?> markAllRead() {
        notificationService.markAllRead();
        return Response.ok();
    }

    @Override
    public Response<NotificationStatistic> statistic() {
        return Response.of(notificationService.statistic());
    }

}
