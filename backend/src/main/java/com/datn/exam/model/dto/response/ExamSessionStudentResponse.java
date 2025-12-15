package com.datn.exam.model.dto.response;

import com.datn.exam.support.enums.SessionStudentStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ExamSessionStudentResponse {
    private int id;
    private String name;

    private String joinToken;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String examName;

    private Integer duration;

    private SessionStudentStatus status;

    private String description;
}
