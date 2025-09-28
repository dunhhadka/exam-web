package com.datn.exam.repository.data.dto;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.Status;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ExamDto {
    private long id;
    private String name;
    private Level level;
    private Status status;
    private boolean publicFlag;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime lastModifiedAt;
}
