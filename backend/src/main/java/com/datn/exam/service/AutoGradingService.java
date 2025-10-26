package com.datn.exam.service;

import com.datn.exam.model.dto.request.SubmitAttemptRequest;
import com.datn.exam.model.entity.ExamAttemptQuestion;

import java.math.BigDecimal;

public interface AutoGradingService {
    public BigDecimal grade(ExamAttemptQuestion question, SubmitAttemptRequest.AnswerSubmission submission);
}
