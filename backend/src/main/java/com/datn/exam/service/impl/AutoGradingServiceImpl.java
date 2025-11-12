package com.datn.exam.service.impl;

import com.datn.exam.model.dto.request.SubmitAttemptRequest;
import com.datn.exam.model.entity.Answer;
import com.datn.exam.model.entity.ExamAttemptQuestion;
import com.datn.exam.model.entity.Question;
import com.datn.exam.repository.AnswerRepository;
import com.datn.exam.service.AutoGradingService;
import com.datn.exam.support.enums.QuestionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class AutoGradingServiceImpl implements AutoGradingService {
    private final AnswerRepository answerRepository;

    @Override
    public BigDecimal grade(
            ExamAttemptQuestion question,
            SubmitAttemptRequest.AnswerSubmission submission
    ) {
        if (submission == null) {
            question.setCorrect(false);
            return BigDecimal.ZERO;
        }

        QuestionType type = question.getType();
        BigDecimal point = question.getPoint();

        return switch (type) {
            case ONE_CHOICE, TRUE_FALSE -> gradeOneChoice(submission, question, point);
            case MULTI_CHOICE -> gradeMultiChoice(submission, question, point);
            case PLAIN_TEXT -> gradePlainText(submission, question, point);
            case TABLE_CHOICE -> gradeTableChoice(submission, question, point);
            case ESSAY -> {
                question.setCorrect(null);
                yield BigDecimal.ZERO;
            }
            default -> {
                question.setCorrect(false);
                yield BigDecimal.ZERO;
            }
        };
    }

    private BigDecimal gradeOneChoice(
            SubmitAttemptRequest.AnswerSubmission submission,
            ExamAttemptQuestion question,
            BigDecimal point
    ) {
        Long selectedId = submission.getSelectedAnswerId();
        if (selectedId == null) {
            question.setCorrect(false);
            return BigDecimal.ZERO;
        }

        Set<Long> correctIds = getCorrectAnswerIdsFromSnapshot(question.getQuestionSnapshot());
        boolean isCorrect = correctIds.size() == 1 && correctIds.contains(selectedId);

        question.setCorrect(isCorrect);
        return isCorrect ? point : BigDecimal.ZERO;
    }

    private BigDecimal gradeMultiChoice(
            SubmitAttemptRequest.AnswerSubmission submission,
            ExamAttemptQuestion question,
            BigDecimal point
    ) {
        List<Long> selectedIds = submission.getSelectedAnswerIds();
        if (selectedIds == null || selectedIds.isEmpty()) {
            question.setCorrect(false);
            return BigDecimal.ZERO;
        }

        Set<Long> correctIds = getCorrectAnswerIdsFromSnapshot(question.getQuestionSnapshot());
        Set<Long> selectedSet = new HashSet<>(selectedIds);

        boolean isCorrect = correctIds.equals(selectedSet);
        question.setCorrect(isCorrect);

        return isCorrect ? point : BigDecimal.ZERO;
    }

    private BigDecimal gradePlainText(
            SubmitAttemptRequest.AnswerSubmission submission,
            ExamAttemptQuestion question,
            BigDecimal point
    ) {
        String userText = submission.getText();
        if (userText == null || userText.isBlank()) {
            question.setCorrect(false);
            return BigDecimal.ZERO;
        }

        Map<String, Object> questionValue = getQuestionValueFromSnapshot(question.getQuestionSnapshot());

        Object expectedAnswerObj = questionValue.get("expectedAnswer");
        Object caseSensitiveObj = questionValue.get("caseSensitive");
        Object exactMatchObj = questionValue.get("exactMatch");

        if (expectedAnswerObj == null || expectedAnswerObj.toString().isBlank()) {
            question.setCorrect(null);
            return BigDecimal.ZERO;
        }

        String expectedAnswer = expectedAnswerObj.toString();
        boolean caseSensitive = Boolean.TRUE.equals(caseSensitiveObj);
        boolean exactMatch = Boolean.TRUE.equals(exactMatchObj);

        String normalized = normalize(userText, caseSensitive);
        String expected = normalize(expectedAnswer, caseSensitive);

        boolean isCorrect = exactMatch
                ? normalized.equals(expected)
                : normalized.contains(expected);

        question.setCorrect(isCorrect);
        return isCorrect ? point : BigDecimal.ZERO;
    }

    @SuppressWarnings("unchecked")
    private BigDecimal gradeTableChoice(
            SubmitAttemptRequest.AnswerSubmission submission,
            ExamAttemptQuestion question,
            BigDecimal point
    ) {
        List<Integer> userRows = submission.getRows();
        if (userRows == null) {
            question.setCorrect(false);
            return BigDecimal.ZERO;
        }

        Map<String, Object> questionValue = getQuestionValueFromSnapshot(question.getQuestionSnapshot());

        Object rowsObj = questionValue.get("rows");
        if (!(rowsObj instanceof List)) {
            question.setCorrect(false);
            return BigDecimal.ZERO;
        }

        List<Map<String, Object>> rows = (List<Map<String, Object>>) rowsObj;

        if (rows.size() != userRows.size()) {
            question.setCorrect(false);
            return BigDecimal.ZERO;
        }

        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = rows.get(i);
            Object correctIdxObj = row.get("correctIndex");
            Integer userIdx = userRows.get(i);

            Integer correctIdx = null;
            if (correctIdxObj instanceof Number) {
                correctIdx = ((Number) correctIdxObj).intValue();
            }

            if (!Objects.equals(correctIdx, userIdx)) {
                question.setCorrect(false);
                return BigDecimal.ZERO;
            }
        }

        question.setCorrect(true);
        return point;
    }

    @Deprecated
    private Set<Long> getCorrectAnswerIds(Long questionId) {
        List<Answer> answers = answerRepository.findByQuestionId(questionId);
        return answers.stream()
                .filter(Answer::getResult)
                .map(Answer::getId)
                .collect(Collectors.toSet());
    }

    @SuppressWarnings("unchecked")
    private Set<Long> getCorrectAnswerIdsFromSnapshot(Map<String, Object> snapshot) {
        if (snapshot == null) {
            return Collections.emptySet();
        }

        Object answersObj = snapshot.get("answers");
        if (!(answersObj instanceof List)) {
            return Collections.emptySet();
        }

        List<Map<String, Object>> answers = (List<Map<String, Object>>) answersObj;

        return answers.stream()
                .filter(ans -> Boolean.TRUE.equals(ans.get("result")))
                .map(ans -> {
                    Object answerIdObj = ans.get("answerId");
                    if (answerIdObj instanceof Number) {
                        return ((Number) answerIdObj).longValue();
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getQuestionValueFromSnapshot(Map<String, Object> snapshot) {
        if (snapshot == null) {
            return Collections.emptyMap();
        }

        Object qvObj = snapshot.get("questionValue");
        if (qvObj instanceof Map) {
            return (Map<String, Object>) qvObj;
        }

        return Collections.emptyMap();
    }

    private String normalize(String text, boolean caseSensitive) {
        String trimmed = text.trim().replaceAll("\\s+", " ");
        return caseSensitive ? trimmed : trimmed.toLowerCase();
    }
}