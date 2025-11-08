package com.datn.exam.model.entity.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class PropertiesChangeEvent implements DomainEvent {
    private List<PropertyChange> changes;

    @Override
    public String eventName() {
        return "";
    }

    @Override
    public LocalDateTime happenAt() {
        return null;
    }
}
