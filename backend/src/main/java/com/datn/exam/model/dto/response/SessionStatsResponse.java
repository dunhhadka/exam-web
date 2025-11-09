package com.datn.exam.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionStatsResponse {
    private String code;
    private String startDate;
    private String endDate;
    private Integer totalStudents;
}
