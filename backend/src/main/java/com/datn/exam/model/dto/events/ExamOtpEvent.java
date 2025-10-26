package com.datn.exam.model.dto.events;

import com.datn.exam.model.dto.OtpMailContext;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ExamOtpEvent extends ApplicationEvent {
    private final OtpMailContext context;

    public ExamOtpEvent(Object source, OtpMailContext context) {
        super(source);
        this.context = context;
    }
}
