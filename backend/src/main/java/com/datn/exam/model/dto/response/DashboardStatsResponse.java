package com.datn.exam.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Integer totalExams;
    private Integer totalStudents;
    private Double averageScore;
    private Double averageTime;
    private Double cheatingRate;
    private List<ScoreDistribution> scoreDistribution;
    private List<AttemptStatusDistribution> attemptStatusDistribution;
    private List<AttemptsOverTime> attemptsOverTime;
    private List<CompletionRateByLevel> completionRateByLevel;
    private List<ExamsCreatedOverTime> examsCreatedOverTime;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreDistribution {
        private String range;
        private Integer count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttemptStatusDistribution {
        private String status;
        private Integer count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttemptsOverTime {
        private String date;
        private Integer count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompletionRateByLevel {
        private String level;
        private Double completionRate; // Tỷ lệ hoàn thành (%)
        private Integer totalAttempts; // Tổng số attempts
        private Integer submittedAttempts; // Số attempts đã nộp
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamsCreatedOverTime {
        private String month;
        private Integer count;
    }
}
