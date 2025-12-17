package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.response.NotificationStatistic;
import com.datn.exam.model.dto.response.Response;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api/notifications")
public interface NotificationController {

    @GetMapping
    Response<?> search();

    @PutMapping("/{notificationId}/read")
    Response<Void> markRead(@PathVariable int notificationId);

    @DeleteMapping("/{notificationId}")
    Response<Void> delete(@PathVariable int notificationId);

    @PutMapping("/read-all")
    Response<?> markAllRead();

    @GetMapping("/statistic")
    Response<NotificationStatistic> statistic();
}
