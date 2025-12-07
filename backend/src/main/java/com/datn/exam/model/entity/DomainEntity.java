package com.datn.exam.model.entity;

import com.datn.exam.model.entity.event.DomainEvent;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.apache.commons.collections4.CollectionUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@MappedSuperclass
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class DomainEntity {

    @Transient
    private List<DomainEvent> events;

    protected void addEvent(DomainEvent event) {
        if (events == null) {
            events = new ArrayList<>();
        }

        events.add(event);
    }

    @PostPersist
    @PostLoad
    @PostRemove
    public void clearEvent() {
        if (CollectionUtils.isNotEmpty(this.events)) {
            this.events.clear();
        }
    }

    public List<DomainEvent> getEvents() {
        if (CollectionUtils.isEmpty(this.events)) {
            return Collections.emptyList();
        }
        return Collections.unmodifiableList(this.events);
    }
}
