package com.datn.exam.model.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationStatistic {
    private Integer total;
    private Integer unreadCount;
}
