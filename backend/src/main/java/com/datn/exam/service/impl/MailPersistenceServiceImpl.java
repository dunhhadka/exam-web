package com.datn.exam.service.impl;

import com.datn.exam.model.dto.OtpMailContext;
import com.datn.exam.model.dto.ResultMailContext;
import com.datn.exam.model.dto.events.ExamOtpEvent;
import com.datn.exam.model.dto.events.ResultMailEvent;
import com.datn.exam.model.entity.Email;
import com.datn.exam.repository.EmailRepository;
import com.datn.exam.service.MailPersistenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MailPersistenceServiceImpl implements MailPersistenceService {
    private final EmailRepository emailRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${spring.mail.username}")
    private String DEFAULT_FROM;

    @Transactional
    @Override
    public void createMail(String email,
                           String subject,
                           String otp,
                           String templateName,
                           Integer expiresMinutes,
                           Integer durationMinutes,
                           Integer lateJoinMinutes) {

        Email mailEntity = this.buildEmail(
                email,
                subject,
                otp,
                templateName,
                expiresMinutes,
                durationMinutes,
                lateJoinMinutes
                );

        emailRepository.save(mailEntity);
        eventPublisher.publishEvent(new ExamOtpEvent(this, new OtpMailContext(mailEntity)));
    }

    @Transactional
    @Override
    public void createResultMail(String email,
                                 String subject,
                                 String templateName,
                                 String studentName,
                                 String examName,
                                 String sessionCode,
                                 String duration,
                                 String submittedDate,
                                 BigDecimal score,
                                 BigDecimal maxScore,
                                 Integer totalQuestions,
                                 Integer correctAnswers,
                                 Integer incorrectAnswers,
                                 Integer accuracy,
                                 Boolean hasCheatingLogs,
                                 List<String> cheatingLogs,
                                 Long attemptId) {
        
        Email mailEntity = Email.builder()
                .from(DEFAULT_FROM)
                .to(email)
                .subject(subject)
                .templateName(templateName)
                .status(Email.Status.PENDING)
                .retryCount(0)
                .attemptId(attemptId)
                .build();

        emailRepository.save(mailEntity);
        
        ResultMailContext context = ResultMailContext.builder()
                .email(mailEntity)
                .studentName(studentName)
                .examName(examName)
                .sessionCode(sessionCode)
                .duration(duration)
                .submittedDate(submittedDate)
                .score(score)
                .maxScore(maxScore)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctAnswers)
                .incorrectAnswers(incorrectAnswers)
                .accuracy(accuracy)
                .hasCheatingLogs(hasCheatingLogs)
                .cheatingLogs(cheatingLogs)
                .build();
        
        eventPublisher.publishEvent(new ResultMailEvent(this, context));
    }

    @Transactional
    @Override
    public void createOrUpdateResultMail(String email,
                                         String subject,
                                         String templateName,
                                         String studentName,
                                         String examName,
                                         String sessionCode,
                                         String duration,
                                         String submittedDate,
                                         BigDecimal score,
                                         BigDecimal maxScore,
                                         Integer totalQuestions,
                                         Integer correctAnswers,
                                         Integer incorrectAnswers,
                                         Integer accuracy,
                                         Boolean hasCheatingLogs,
                                         List<String> cheatingLogs,
                                         Long attemptId) {
        
        // Tìm email notification hiện có của attempt này
        List<Email> existingEmails = emailRepository.findByAttemptId(attemptId);
        Email mailEntity;
        
        if (!existingEmails.isEmpty()) {
            // Update bản ghi cũ - lấy bản ghi mới nhất
            mailEntity = existingEmails.get(0);
            mailEntity.setStatus(Email.Status.PENDING);
            mailEntity.setRetryCount(mailEntity.getRetryCount() + 1);
            mailEntity.setSubject(subject);
            mailEntity.setTo(email);
            emailRepository.save(mailEntity);
        } else {
            // Tạo mới nếu chưa có
            mailEntity = Email.builder()
                    .from(DEFAULT_FROM)
                    .to(email)
                    .subject(subject)
                    .templateName(templateName)
                    .status(Email.Status.PENDING)
                    .retryCount(0)
                    .attemptId(attemptId)
                    .build();
            emailRepository.save(mailEntity);
        }
        
        ResultMailContext context = ResultMailContext.builder()
                .email(mailEntity)
                .studentName(studentName)
                .examName(examName)
                .sessionCode(sessionCode)
                .duration(duration)
                .submittedDate(submittedDate)
                .score(score)
                .maxScore(maxScore)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctAnswers)
                .incorrectAnswers(incorrectAnswers)
                .accuracy(accuracy)
                .hasCheatingLogs(hasCheatingLogs)
                .cheatingLogs(cheatingLogs)
                .build();
        
        eventPublisher.publishEvent(new ResultMailEvent(this, context));
    }

    private Email buildEmail(String to,
                             String subject,
                             String otp,
                             String templateName,
                             Integer expiresMinutes,
                             Integer durationMinutes,
                             Integer lateJoinMinutes
                             ) {
        return Email.builder()
                .from(DEFAULT_FROM)
                .to(to)
                .subject(subject)
                .otp(otp)
                .templateName(templateName)
                .expiresMinutes(expiresMinutes)
                .durationMinutes(durationMinutes)
                .lateJoinMinutes(lateJoinMinutes)
                .status(Email.Status.PENDING)
                .retryCount(0)
                .build();
    }
}
