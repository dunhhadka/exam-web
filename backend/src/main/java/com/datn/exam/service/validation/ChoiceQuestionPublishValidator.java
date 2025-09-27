package com.datn.exam.service.validation;

import com.datn.exam.model.dto.request.AnswerCreateRequest;
import com.datn.exam.model.dto.request.QuestionCreateBase;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.support.enums.QuestionType;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class ChoiceQuestionPublishValidator {
    public List<InvalidFieldError> validate(QuestionCreateBase request, String objectName) {
        List<InvalidFieldError> errors = new ArrayList<>();
        QuestionType type = request.getType();

        var answers = request.getAnswers();

        if (!isChoice(type)) {
            return errors;
        }

        if (type == QuestionType.TRUE_FALSE) {
            if (CollectionUtils.size(request.getAnswers()) != 2) {
                errors.add(err(objectName, "answers", "QUESTION_TRUE_FALSE_REQUIRE_2_ANSWERS"));
                return errors;
            }
        } else {
            if (CollectionUtils.size(answers) < 2) {
                errors.add(err(objectName, "answers", "ANSWER_MIN_TWO_REQUIRE"));
            }
        }

        if (CollectionUtils.isEmpty(answers)) return errors;

        //NOTE: Validate answers;
        for(int i = 0; i < answers.size(); i++) {
            AnswerCreateRequest a = answers.get(i);

            if (a.getOrderIndex() == null) {
                errors.add(err(objectName, "answers[" + i + "].orderIndex", "ANSWER_ORDER_INDEX_REQUIRED"));
            } else if (a.getOrderIndex() < 0) {
                errors.add(err(objectName, "answers[" + i + "].orderIndex", "ANSWER_ORDER_INDEX_INVALID"));
            }

            if (StringUtils.isBlank(a.getValue())) {
                errors.add(err(objectName, "answers[" + i + "].value", "ANSWER_TEXT_REQUIRED"));
            }
        }

        //NOTE: duplicate orderIndex
        var orderIndices = answers.stream().map(AnswerCreateRequest::getOrderIndex).filter(Objects::nonNull).toList();
        Map<Integer, Long> freq = orderIndices.stream().collect(Collectors.groupingBy(i -> i, Collectors.counting()));
        var dups = freq.entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).toList();
        if (!dups.isEmpty()) {
            errors.add(err(objectName, "answers", "ANSWER_DUPLICATE_ORDER_INDEX"));
        }

        // Số đáp án đúng
        long correctCount = answers.stream().filter(a -> Boolean.TRUE.equals(a.getResult())).count();
        if (type == QuestionType.ONE_CHOICE || type == QuestionType.TRUE_FALSE) {
            if (correctCount != 1) {
                errors.add(err(objectName, "answers", "ANSWER_REQUIRE_EXACTLY_ONE_CORRECT"));
            }
        } else if (type == QuestionType.MULTI_CHOICE) {
            if (correctCount < 1) {
                errors.add(err(objectName, "answers", "ANSWER_REQUIRE_AT_LEAST_ONE_CORRECT"));
            }
        }

        return errors;
    }

    private boolean isChoice(QuestionType type) {
        return type == QuestionType.ONE_CHOICE
                || type == QuestionType.MULTI_CHOICE
                || type == QuestionType.TRUE_FALSE;
    }

    private InvalidFieldError err(String objectName, String field, String message) {
        return InvalidFieldError.builder()
                .objectName(objectName)
                .field(field)
                .message(message)
                .build();
    }
}
