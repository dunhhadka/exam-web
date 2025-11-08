package com.datn.exam.model.entity.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyChange {
    private String name;
    private Object oldValue;
    private Object currentValue;
}
