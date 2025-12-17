package com.datn.exam.model.dto.events;

import com.datn.exam.model.dto.ResultMailContext;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ResultMailEvent extends ApplicationEvent {
    private final ResultMailContext context;

    public ResultMailEvent(Object source, ResultMailContext context) {
        super(source);
        this.context = context;
    }
}
