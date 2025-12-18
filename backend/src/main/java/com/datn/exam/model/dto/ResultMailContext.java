package com.datn.exam.model.dto;

import com.datn.exam.model.entity.Email;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class ResultMailContext implements BaseMailContext {
    
    private final Email email;
    private final String studentName;
    private final String examName;
    private final String sessionCode;
    private final String duration;
    private final String submittedDate;
    private final BigDecimal score;
    private final BigDecimal maxScore;
    private final Integer totalQuestions;
    private final Integer correctAnswers;
    private final Integer incorrectAnswers;
    private final Integer accuracy;
    private final Boolean hasCheatingLogs;
    private final List<String> cheatingLogs;

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
        vars.put("studentName", this.studentName);
        vars.put("examName", this.examName);
        vars.put("sessionCode", this.sessionCode);
        vars.put("duration", this.duration);
        vars.put("submittedDate", this.submittedDate);
        vars.put("score", this.score);
        vars.put("maxScore", this.maxScore);
        vars.put("totalQuestions", this.totalQuestions);
        vars.put("correctAnswers", this.correctAnswers);
        vars.put("incorrectAnswers", this.incorrectAnswers);
        vars.put("accuracy", this.accuracy);
        vars.put("hasCheatingLogs", this.hasCheatingLogs != null && this.hasCheatingLogs);
        vars.put("cheatingLogs", this.cheatingLogs != null ? this.cheatingLogs : List.of());
        return vars;
    }
}
