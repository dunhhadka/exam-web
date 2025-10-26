package com.datn.exam.model.dto;

import com.datn.exam.model.entity.Email;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

import static com.datn.exam.support.constants.MailVariableConstants.*;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class OtpMailContext implements BaseMailContext{

   private final Email email;


    @Override
    public String getTemplateName() {
        return email.getTemplateName();
    }

    @Override
    public String getSubject() {
        return email.getSubject();
    }

    @Override
    public String getTo() {
        return email.getTo();
    }

    @Override
    public Map<String, Object> toVariables() {
        Map<String, Object> vars = new HashMap<>();
        vars.put(OTP, this.email.getOtp());
        vars.put(EXPIRES_MINUTES, email.getExpiresMinutes());
        vars.put(DURATION_MINUTES, email.getDurationMinutes());
        vars.put(LATE_JOIN_MINUTES, email.getLateJoinMinutes());
        vars.put(EMAIL_BODY, email.getTo());
        return vars;
    }
}
