package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.SessionStudentStatus;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Getter
@Setter
public class ExamStudentFilterRequest extends CursorRequest {

    private String name;

    @DateTimeFormat(pattern = "dd-MM-yyyy HH:mm:ss")
    private LocalDateTime startTime;

    @DateTimeFormat(pattern = "dd-MM-yyyy HH:mm:ss")
    private LocalDateTime endTime;

    private SessionStudentStatus status;
}
