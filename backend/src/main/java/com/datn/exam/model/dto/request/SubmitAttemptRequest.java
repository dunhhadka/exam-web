package com.datn.exam.model.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SubmitAttemptRequest {

    @NotEmpty(message = "ANSWERS_REQUIRED")
    @Valid
    private List<AnswerSubmission> answers;

    @Data
    public static class AnswerSubmission {
        @NotNull(message = "ATTEMPT_QUESTION_ID_REQUIRED")
        private Long attemptQuestionId;

        private Long selectedAnswerId;
        private List<Long> selectedAnswerIds;
        private String text;
        private List<Integer> rows;
    }
}