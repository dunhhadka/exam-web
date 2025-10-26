package com.datn.exam.config.application.jobs;

import com.datn.exam.model.dto.OtpMailContext;
import com.datn.exam.model.dto.events.ExamOtpEvent;
import com.datn.exam.model.entity.Email;
import com.datn.exam.repository.EmailRepository;
import com.datn.exam.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExamEmailEventListener {
    private final EmailService emailService;
    private final EmailRepository emailRepository;

    @Async("mailExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onExamEmail(ExamOtpEvent event) {
        sendAndMark(event.getContext());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected void sendAndMark(OtpMailContext ctx) {
        emailRepository.findById(ctx.getEmail().getId()).ifPresent(email -> {
            try {
                emailService.sendMail(ctx);

                email.setStatus(Email.Status.SENT);
                email.setRetryCount((email.getRetryCount() == null ? 0 : email.getRetryCount()) + 1);
                log.info("Sent order mail to {}", email.getTo());
            } catch (Exception ex) {
                email.setStatus(Email.Status.FAILED);
                email.setRetryCount((email.getRetryCount() == null ? 0 : email.getRetryCount()) + 1);
                log.error("Send mail failed ", ex);
            }

            emailRepository.save(email);
        });
    }
}
