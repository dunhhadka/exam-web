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

        Set<Long> correctIds = getCorrectAnswerIds(question.getQuestionId());
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

        Set<Long> correctIds = getCorrectAnswerIds(question.getQuestionId());
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

        Question q = question.getQuestion();
        if (q == null || !(q.getQuestionValue() instanceof Question.PlainTextQuestion ptq)) {
            question.setCorrect(null);
            return BigDecimal.ZERO;
        }

        String expectedAnswer = ptq.getExpectedAnswer();
        Boolean caseSensitive = ptq.getCaseSensitive();
        Boolean exactMatch = ptq.getExactMatch();

        if (expectedAnswer == null || expectedAnswer.isBlank()) {
            question.setCorrect(null);
            return BigDecimal.ZERO;
        }

        String normalized = normalize(userText, Boolean.TRUE.equals(caseSensitive));
        String expected = normalize(expectedAnswer, Boolean.TRUE.equals(caseSensitive));

        boolean isCorrect = Boolean.TRUE.equals(exactMatch)
                ? normalized.equals(expected)
                : normalized.contains(expected);

        question.setCorrect(isCorrect);
        return isCorrect ? point : BigDecimal.ZERO;
    }

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

        Question q = question.getQuestion();
        if (q == null || !(q.getQuestionValue() instanceof Question.TableChoiceQuestion tcq)) {
            question.setCorrect(false);
            return BigDecimal.ZERO;
        }

        List<Question.RowCompact> rows = tcq.getRows();
        if (rows == null || rows.size() != userRows.size()) {
            question.setCorrect(false);
            return BigDecimal.ZERO;
        }

        for (int i = 0; i < rows.size(); i++) {
            Integer correctIdx = rows.get(i).getCorrectIndex();
            Integer userIdx = userRows.get(i);

            if (!Objects.equals(correctIdx, userIdx)) {
                question.setCorrect(false);
                return BigDecimal.ZERO;
            }
        }

        question.setCorrect(true);
        return point;
    }

    private Set<Long> getCorrectAnswerIds(Long questionId) {
        List<Answer> answers = answerRepository.findByQuestionId(questionId);
        return answers.stream()
                .filter(Answer::getResult)
                .map(Answer::getId)
                .collect(Collectors.toSet());
    }

    private String normalize(String text, boolean caseSensitive) {
        String trimmed = text.trim().replaceAll("\\s+", " ");
        return caseSensitive ? trimmed : trimmed.toLowerCase();
    }
}