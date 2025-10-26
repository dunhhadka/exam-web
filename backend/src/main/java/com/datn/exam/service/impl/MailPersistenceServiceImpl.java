package com.datn.exam.service.impl;

import com.datn.exam.model.dto.OtpMailContext;
import com.datn.exam.model.dto.events.ExamOtpEvent;
import com.datn.exam.model.entity.Email;
import com.datn.exam.repository.EmailRepository;
import com.datn.exam.service.MailPersistenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
