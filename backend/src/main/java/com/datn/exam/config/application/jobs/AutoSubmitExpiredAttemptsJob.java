package com.datn.exam.config.application.jobs;

import com.datn.exam.model.entity.ExamAttempt;
import com.datn.exam.repository.ExamAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;


@Component
@RequiredArgsConstructor
@Slf4j
public class AutoSubmitExpiredAttemptsJob {
    private final ExamAttemptRepository examAttemptRepository;


    @Scheduled(fixedDelay = 120000, initialDelay = 60000)
    @Transactional
    public void autoSubmitExpiredAttempts() {
        log.info("Starting auto-submit job for expired exam attempts");
        
        try {
            LocalDateTime now = LocalDateTime.now();
            
            List<ExamAttempt> inProgressAttempts = examAttemptRepository
                    .findByStatus(ExamAttempt.AttemptStatus.IN_PROGRESS);
            
            int expiredCount = 0;
            
            for (ExamAttempt attempt : inProgressAttempts) {
                Integer durationMinutes = attempt.getExamSession().getDurationMinutes();
                if (durationMinutes == null || durationMinutes <= 0) {
                    log.warn("Attempt {} has invalid duration, skipping", attempt.getId());
                    continue;
                }
                
                LocalDateTime expireAt = attempt.getStartedAt()
                        .plusSeconds((long) durationMinutes * 60);
                
                LocalDateTime sessionDeadline = null;
                if (attempt.getExamSession().getEndTime() != null) {
                    Integer lateJoinMinutes = attempt.getExamSession().getLateJoinMinutes();
                    long lateJoinSeconds = (lateJoinMinutes != null ? lateJoinMinutes : 0) * 60L;
                    sessionDeadline = attempt.getExamSession().getEndTime().plusSeconds(lateJoinSeconds);
                }
                
                LocalDateTime finalDeadline = expireAt;
                if (sessionDeadline != null && sessionDeadline.isBefore(expireAt)) {
                    finalDeadline = sessionDeadline;
                }

                if (now.isAfter(finalDeadline.plusSeconds(5))) {
                    log.info("Auto-submitting expired attempt: {} (Student: {}, Session: {}, Started: {}, Final deadline: {})",
                            attempt.getId(),
                            attempt.getStudentEmail(),
                            attempt.getExamSession().getId(),
                            attempt.getStartedAt(),
                            finalDeadline);
                    
                    attempt.setStatus(ExamAttempt.AttemptStatus.ABANDONED);
                    attempt.setGradingStatus(ExamAttempt.GradingStatus.DONE);
                    attempt.setSubmittedAt(now);
                    attempt.setScoreAuto(BigDecimal.ZERO);
                    attempt.setScoreManual(BigDecimal.ZERO);
                    
                    examAttemptRepository.save(attempt);
                    expiredCount++;
                }
            }
            
            if (expiredCount > 0) {
                log.info("Auto-submit job completed: {} attempts were automatically submitted", expiredCount);
            } else {
                log.debug("Auto-submit job completed: No expired attempts found");
            }
            
        } catch (Exception e) {
            log.error("Error during auto-submit job execution", e);
        }
    }
}
