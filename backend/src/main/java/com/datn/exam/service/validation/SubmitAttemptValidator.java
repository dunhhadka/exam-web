package com.datn.exam.service.validation;

import com.datn.exam.model.dto.request.SubmitAttemptRequest;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.model.entity.ExamAttempt;
import com.datn.exam.model.entity.ExamAttemptQuestion;
import com.datn.exam.repository.ExamAttemptRepository;
import com.datn.exam.support.enums.QuestionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class SubmitAttemptValidator {
    private final ExamAttemptRepository examAttemptRepository;

    public List<InvalidFieldError> validate(SubmitAttemptRequest request, Long attemptId) {
        List<InvalidFieldError> errors = new ArrayList<>();

        Optional<ExamAttempt> attemptOpt = examAttemptRepository.findById(attemptId);
        if (attemptOpt.isEmpty()) {
            errors.add(new InvalidFieldError("attemptId", "EXAM_ATTEMPT_NOT_FOUND", null));
            return errors;
        }

        ExamAttempt attempt = attemptOpt.get();

        Map<Long, ExamAttemptQuestion> questionMap = attempt.getAttemptQuestions().stream()
                .collect(HashMap::new, (m, q) -> m.put(q.getId(), q), HashMap::putAll);

        for (int i = 0; i < request.getAnswers().size(); i++) {
            SubmitAttemptRequest.AnswerSubmission submission = request.getAnswers().get(i);
            String fieldPrefix = "answers[" + i + "]";

            Long attemptQuestionId = submission.getAttemptQuestionId();

            if (attemptQuestionId == null) {
                //errors.add(new InvalidFieldError(fieldPrefix + ".attemptQuestionId", "REQUIRED", null));
                continue;
            }

            ExamAttemptQuestion question = questionMap.get(attemptQuestionId);
            if (question == null) {
                errors.add(new InvalidFieldError(
                        fieldPrefix + ".attemptQuestionId",
                        "INVALID_ATTEMPT_QUESTION",
                        attemptQuestionId.toString()
                ));
                continue;
            }

            QuestionType type = question.getType();
            validateAnswerByType(submission, type, fieldPrefix, errors);
        }

        return new ArrayList<>();
    }

    private void validateAnswerByType(
            SubmitAttemptRequest.AnswerSubmission submission,
            QuestionType type,
            String fieldPrefix,
            List<InvalidFieldError> errors
    ) {
        switch (type) {
            case ONE_CHOICE, TRUE_FALSE -> {
                if (submission.getSelectedAnswerId() == null) {
                    errors.add(new InvalidFieldError(
                            fieldPrefix + ".selectedAnswerId",
                            "SELECTED_ANSWER_REQUIRED",
                            null
                    ));
                }

                if (submission.getSelectedAnswerIds() != null ||
                        submission.getText() != null ||
                        submission.getRows() != null) {
                    errors.add(new InvalidFieldError(
                            fieldPrefix,
                            "INVALID_FIELDS_FOR_" + type.name(),
                            null
                    ));
                }
            }
            case MULTI_CHOICE -> {
                if (submission.getSelectedAnswerIds() == null ||
                        submission.getSelectedAnswerIds().isEmpty()) {
                    errors.add(new InvalidFieldError(
                            fieldPrefix + ".selectedAnswerIds",
                            "SELECTED_ANSWERS_REQUIRED",
                            null
                    ));
                }

                if (submission.getSelectedAnswerId() != null ||
                        submission.getText() != null ||
                        submission.getRows() != null) {
                    errors.add(new InvalidFieldError(
                            fieldPrefix,
                            "INVALID_FIELDS_FOR_MULTI_CHOICE",
                            null
                    ));
                }
            }
            case PLAIN_TEXT, ESSAY -> {
                if (submission.getText() == null || submission.getText().isBlank()) {
                    errors.add(new InvalidFieldError(
                            fieldPrefix + ".text",
                            "TEXT_REQUIRED",
                            null
                    ));
                }

                if (submission.getSelectedAnswerId() != null ||
                        submission.getSelectedAnswerIds() != null ||
                        submission.getRows() != null) {
                    errors.add(new InvalidFieldError(
                            fieldPrefix,
                            "INVALID_FIELDS_FOR_" + type.name(),
                            null
                    ));
                }
            }
            case TABLE_CHOICE -> {
                if (submission.getRows() == null || submission.getRows().isEmpty()) {
                    errors.add(new InvalidFieldError(
                            fieldPrefix + ".rows",
                            "ROWS_REQUIRED",
                            null
                    ));
                }

                if (submission.getSelectedAnswerId() != null ||
                        submission.getSelectedAnswerIds() != null ||
                        submission.getText() != null) {
                    errors.add(new InvalidFieldError(
                            fieldPrefix,
                            "INVALID_FIELDS_FOR_TABLE_CHOICE",
                            null
                    ));
                }
            }
        }
    }
}