package com.datn.exam.repository.data.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class ExamSessionDto {
    private Long id;
    private String examName;
    private String examSessionName;
    private boolean isPublic;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal score; // Điểm max
    private Integer durationMinutes;
    private Integer countSubmit;     // Số lượng đã nộp
    private Integer totalSubmit;     // Tổng số cần nộp
    private Integer countMarked;     // Số lượng đã chấm
    private Integer totalMarked;     // Tổng số cần chấm

}
