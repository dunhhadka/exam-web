package com.datn.exam.service.impl;

import com.datn.exam.model.dto.response.DashboardStatsResponse;
import com.datn.exam.model.entity.Exam;
import com.datn.exam.model.entity.ExamAttempt;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.repository.ExamAttemptRepository;
import com.datn.exam.repository.ExamRepository;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.service.DashboardService;
import com.datn.exam.support.enums.Level;
import com.datn.exam.support.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {
    private final ExamRepository examRepository;
    private final ExamSessionRepository examSessionRepository;
    private final ExamAttemptRepository examAttemptRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        String currentUser = SecurityUtils.getCurrentUser()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));

        log.debug("Fetching dashboard stats for user: {}", currentUser);

        // Tối ưu: Query trực tiếp với WHERE clause thay vì load tất cả rồi filter
        List<Exam> teacherExams = examRepository.findByCreatedByAndNotDeleted(currentUser);
        
        if (teacherExams.isEmpty()) {
            log.debug("No exams found for user: {}", currentUser);
            return buildEmptyDashboardStats();
        }

        Set<Long> examIds = teacherExams.stream()
                .map(Exam::getId)
                .collect(Collectors.toSet());

        // Tối ưu: Query với JOIN FETCH để tránh N+1 queries
        List<ExamSession> sessions = examSessionRepository.findByExamIdsWithExam(examIds);
        
        if (sessions.isEmpty()) {
            log.debug("No sessions found for exams: {}", examIds);
            return buildDashboardStatsWithExamsOnly(teacherExams);
        }

        Set<Long> sessionIds = sessions.stream()
                .map(ExamSession::getId)
                .collect(Collectors.toSet());

        // Tối ưu: Query với JOIN FETCH để tránh N+1 queries khi access examSession.exam.level
        List<ExamAttempt> attempts = examAttemptRepository.findBySessionIdsWithRelations(sessionIds);

        // 1. Tổng số bài thi
        int totalExams = teacherExams.size();

        // 2. Tổng số học viên (unique students) - chỉ đếm email không null
        int totalStudents = (int) attempts.stream()
                .map(ExamAttempt::getStudentEmail)
                .filter(Objects::nonNull)
                .filter(email -> !email.isBlank())
                .distinct()
                .count();

        // 3. Điểm trung bình
        double averageScore = attempts.stream()
                .filter(a -> a.getStatus() == ExamAttempt.AttemptStatus.SUBMITTED)
                .filter(a -> a.getScoreAuto() != null)
                .mapToDouble(a -> a.getScoreAuto().doubleValue())
                .average()
                .orElse(0.0);

        // 4. Thời gian làm bài trung bình (phút)
        double averageTime = attempts.stream()
                .filter(a -> a.getStatus() == ExamAttempt.AttemptStatus.SUBMITTED)
                .filter(a -> a.getStartedAt() != null && a.getSubmittedAt() != null)
                .mapToLong(a -> Duration.between(a.getStartedAt(), a.getSubmittedAt()).toMinutes())
                .average()
                .orElse(0.0);

        // 5. Tỷ lệ gian lận (mock data - cần implement logic phát hiện gian lận)
        double cheatingRate = 0.0;

        // 6. Phân bố điểm số
        List<DashboardStatsResponse.ScoreDistribution> scoreDistribution = calculateScoreDistribution(attempts);

        // 7. Phân bố trạng thái bài thi
        List<DashboardStatsResponse.AttemptStatusDistribution> statusDistribution = calculateStatusDistribution(attempts);

        // 8. Lượt thi theo thời gian (7 ngày gần nhất)
        List<DashboardStatsResponse.AttemptsOverTime> attemptsOverTime = calculateAttemptsOverTime(attempts);

        // 9. Tỷ lệ hoàn thành theo mức độ
        List<DashboardStatsResponse.CompletionRateByLevel> completionRateByLevel = calculateCompletionRateByLevel(attempts);

        // 10. Bài thi được tạo theo tháng (6 tháng gần nhất)
        List<DashboardStatsResponse.ExamsCreatedOverTime> examsCreatedOverTime = calculateExamsCreatedOverTime(teacherExams);

        return DashboardStatsResponse.builder()
                .totalExams(totalExams)
                .totalStudents(totalStudents)
                .averageScore(roundToTwo(averageScore))
                .averageTime(roundToTwo(averageTime))
                .cheatingRate(cheatingRate)
                .scoreDistribution(scoreDistribution)
                .attemptStatusDistribution(statusDistribution)
                .attemptsOverTime(attemptsOverTime)
                .completionRateByLevel(completionRateByLevel)
                .examsCreatedOverTime(examsCreatedOverTime)
                .build();
    }

    private List<DashboardStatsResponse.ScoreDistribution> calculateScoreDistribution(List<ExamAttempt> attempts) {
        Map<String, Integer> distribution = new LinkedHashMap<>();
        distribution.put("0-20", 0);
        distribution.put("21-40", 0);
        distribution.put("41-60", 0);
        distribution.put("61-80", 0);
        distribution.put("81-100", 0);

        attempts.stream()
                .filter(a -> a.getStatus() == ExamAttempt.AttemptStatus.SUBMITTED)
                .filter(a -> a.getScoreAuto() != null)
                .forEach(a -> {
                    double score = a.getScoreAuto().doubleValue();
                    if (score <= 20) distribution.merge("0-20", 1, Integer::sum);
                    else if (score <= 40) distribution.merge("21-40", 1, Integer::sum);
                    else if (score <= 60) distribution.merge("41-60", 1, Integer::sum);
                    else if (score <= 80) distribution.merge("61-80", 1, Integer::sum);
                    else distribution.merge("81-100", 1, Integer::sum);
                });

        return distribution.entrySet().stream()
                .map(e -> DashboardStatsResponse.ScoreDistribution.builder()
                        .range(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private List<DashboardStatsResponse.AttemptStatusDistribution> calculateStatusDistribution(List<ExamAttempt> attempts) {
        Map<String, Long> statusCount = attempts.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStatus().name(),
                        Collectors.counting()
                ));

        return statusCount.entrySet().stream()
                .map(e -> DashboardStatsResponse.AttemptStatusDistribution.builder()
                        .status(e.getKey())
                        .count(e.getValue().intValue())
                        .build())
                .collect(Collectors.toList());
    }

    private List<DashboardStatsResponse.AttemptsOverTime> calculateAttemptsOverTime(List<ExamAttempt> attempts) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, Integer> dailyAttempts = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");

        // Khởi tạo 7 ngày gần nhất
        for (int i = 6; i >= 0; i--) {
            LocalDateTime date = now.minusDays(i);
            dailyAttempts.put(date.format(formatter), 0);
        }

        // Đếm attempts theo ngày
        attempts.stream()
                .filter(a -> a.getStartedAt() != null)
                .filter(a -> a.getStartedAt().isAfter(now.minusDays(7)))
                .forEach(a -> {
                    String dateKey = a.getStartedAt().format(formatter);
                    dailyAttempts.merge(dateKey, 1, Integer::sum);
                });

        return dailyAttempts.entrySet().stream()
                .map(e -> DashboardStatsResponse.AttemptsOverTime.builder()
                        .date(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private List<DashboardStatsResponse.CompletionRateByLevel> calculateCompletionRateByLevel(List<ExamAttempt> attempts) {
        // Map để lưu tổng số attempts và số attempts đã nộp theo từng mức độ
        Map<Level, Integer> totalAttemptsByLevel = new HashMap<>();
        Map<Level, Integer> submittedAttemptsByLevel = new HashMap<>();
        
        attempts.stream()
                .filter(a -> a.getExamSession() != null)
                .filter(a -> a.getExamSession().getExam() != null)
                .forEach(a -> {
                    try {
                        Level level = a.getExamSession().getExam().getLevel();
                        if (level != null) {
                            // Đếm tổng số attempts
                            totalAttemptsByLevel.merge(level, 1, Integer::sum);
                            
                            // Đếm số attempts đã nộp
                            if (a.getStatus() == ExamAttempt.AttemptStatus.SUBMITTED) {
                                submittedAttemptsByLevel.merge(level, 1, Integer::sum);
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Error getting level for attempt {}: {}", a.getId(), e.getMessage());
                    }
                });

        return Arrays.stream(Level.values())
                .map(level -> {
                    int total = totalAttemptsByLevel.getOrDefault(level, 0);
                    int submitted = submittedAttemptsByLevel.getOrDefault(level, 0);
                    
                    // Tính tỷ lệ hoàn thành (%)
                    double completionRate = total > 0 ? (submitted * 100.0 / total) : 0.0;
                    
                    return DashboardStatsResponse.CompletionRateByLevel.builder()
                            .level(level.name())
                            .completionRate(roundToTwo(completionRate))
                            .totalAttempts(total)
                            .submittedAttempts(submitted)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<DashboardStatsResponse.ExamsCreatedOverTime> calculateExamsCreatedOverTime(List<Exam> exams) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, Integer> monthlyExams = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yyyy");

        // Khởi tạo 6 tháng gần nhất
        for (int i = 5; i >= 0; i--) {
            LocalDateTime date = now.minusMonths(i);
            monthlyExams.put(date.format(formatter), 0);
        }

        // Đếm exams theo tháng
        exams.stream()
                .filter(e -> e.getCreatedAt() != null)
                .filter(e -> e.getCreatedAt().isAfter(now.minusMonths(6)))
                .forEach(e -> {
                    String monthKey = e.getCreatedAt().format(formatter);
                    monthlyExams.merge(monthKey, 1, Integer::sum);
                });

        return monthlyExams.entrySet().stream()
                .map(e -> DashboardStatsResponse.ExamsCreatedOverTime.builder()
                        .month(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private double roundToTwo(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    /**
     * Build empty dashboard stats khi không có exams
     */
    private DashboardStatsResponse buildEmptyDashboardStats() {
        return DashboardStatsResponse.builder()
                .totalExams(0)
                .totalStudents(0)
                .averageScore(0.0)
                .averageTime(0.0)
                .cheatingRate(0.0)
                .scoreDistribution(initializeScoreDistribution())
                .attemptStatusDistribution(Collections.emptyList())
                .attemptsOverTime(initializeAttemptsOverTime())
                .completionRateByLevel(initializeCompletionRateByLevel())
                .examsCreatedOverTime(initializeExamsCreatedOverTime())
                .build();
    }

    /**
     * Build dashboard stats khi chỉ có exams nhưng chưa có sessions/attempts
     */
    private DashboardStatsResponse buildDashboardStatsWithExamsOnly(List<Exam> exams) {
        return DashboardStatsResponse.builder()
                .totalExams(exams.size())
                .totalStudents(0)
                .averageScore(0.0)
                .averageTime(0.0)
                .cheatingRate(0.0)
                .scoreDistribution(initializeScoreDistribution())
                .attemptStatusDistribution(Collections.emptyList())
                .attemptsOverTime(initializeAttemptsOverTime())
                .completionRateByLevel(initializeCompletionRateByLevel())
                .examsCreatedOverTime(calculateExamsCreatedOverTime(exams))
                .build();
    }

    private List<DashboardStatsResponse.ScoreDistribution> initializeScoreDistribution() {
        return Arrays.asList(
                DashboardStatsResponse.ScoreDistribution.builder().range("0-20").count(0).build(),
                DashboardStatsResponse.ScoreDistribution.builder().range("21-40").count(0).build(),
                DashboardStatsResponse.ScoreDistribution.builder().range("41-60").count(0).build(),
                DashboardStatsResponse.ScoreDistribution.builder().range("61-80").count(0).build(),
                DashboardStatsResponse.ScoreDistribution.builder().range("81-100").count(0).build()
        );
    }

    private List<DashboardStatsResponse.AttemptsOverTime> initializeAttemptsOverTime() {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
        List<DashboardStatsResponse.AttemptsOverTime> result = new ArrayList<>();
        
        for (int i = 6; i >= 0; i--) {
            LocalDateTime date = now.minusDays(i);
            result.add(DashboardStatsResponse.AttemptsOverTime.builder()
                    .date(date.format(formatter))
                    .count(0)
                    .build());
        }
        return result;
    }

    private List<DashboardStatsResponse.CompletionRateByLevel> initializeCompletionRateByLevel() {
        return Arrays.stream(Level.values())
                .map(level -> DashboardStatsResponse.CompletionRateByLevel.builder()
                        .level(level.name())
                        .completionRate(0.0)
                        .totalAttempts(0)
                        .submittedAttempts(0)
                        .build())
                .collect(Collectors.toList());
    }

    private List<DashboardStatsResponse.ExamsCreatedOverTime> initializeExamsCreatedOverTime() {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yyyy");
        List<DashboardStatsResponse.ExamsCreatedOverTime> result = new ArrayList<>();
        
        for (int i = 5; i >= 0; i--) {
            LocalDateTime date = now.minusMonths(i);
            result.add(DashboardStatsResponse.ExamsCreatedOverTime.builder()
                    .month(date.format(formatter))
                    .count(0)
                    .build());
        }
        return result;
    }
}
