package com.datn.exam.service.impl;

import com.datn.exam.model.dto.BaseMailContext;
import com.datn.exam.model.dto.OtpMailContext;
import com.datn.exam.service.EmailService;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.exception.ResponseException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.spring6.SpringTemplateEngine;

import org.thymeleaf.context.Context;


@RequiredArgsConstructor
@Service
@Slf4j
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Override
    public void sendMail(BaseMailContext ctx) {
        try {
            validate(ctx);

            Context thymeleafCtx = new Context();
            ctx.toVariables().forEach(thymeleafCtx::setVariable);

            String html = templateEngine.process(ctx.getTemplateName(), thymeleafCtx);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(ctx.getTo());
            helper.setSubject(ctx.getSubject());
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Email sent using template [{}] to {}", ctx.getTemplateName(), ctx.getTo());
        } catch (Exception e) {
            log.error("Failed to send email [{}]: {}", ctx.getTemplateName(), e.getMessage(), e);
            throw new ResponseException(BadRequestError.EMAIL_SEND_FAILED);
        }
    }

    private void validate(BaseMailContext ctx) {
        if (ctx == null) throw new IllegalArgumentException("ctx is null");
        if (ctx.getTo() == null || ctx.getTo().isBlank()) throw new IllegalArgumentException("to is empty");
    }
}
