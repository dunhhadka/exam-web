package com.datn.exam.repository.data.dto;

<<<<<<< HEAD
import com.datn.exam.support.enums.SessionStudentStatus;
=======
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ExamSessionStudentDto {
    private int id;
    private int examSessionId;

    private String name;

    private String joinToken;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String examName;

    private Integer duration;
<<<<<<< HEAD

    private SessionStudentStatus status;
=======
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
}
