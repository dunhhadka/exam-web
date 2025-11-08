package com.datn.exam.model.entity.event;

import java.time.LocalDateTime;

public interface DomainEvent {
    String eventName();

    LocalDateTime happenAt();
}
