package com.datn.exam.repository.data.dto;

import com.datn.exam.support.enums.SessionStudentStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ExamSessionStudentDto {
    private int id;
    private String name;

    private String joinToken;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String examName;

    private Integer duration;

    private SessionStudentStatus status;
}
