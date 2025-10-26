package com.datn.exam.model.dto.mapper;

import com.datn.exam.model.dto.request.SubmitAttemptRequest;
import com.datn.exam.support.enums.QuestionType;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.datn.exam.support.enums.QuestionType.*;

@Component
public class AnswerPayloadMapper {

    public Map<String, Object> toPayload(
            SubmitAttemptRequest.AnswerSubmission submission,
            QuestionType type
    ) {
        if (submission == null) return Collections.emptyMap();

        Map<String, Object> payload = new LinkedHashMap<>();

        switch (type) {
            case ONE_CHOICE, TRUE_FALSE -> {
                if (submission.getSelectedAnswerId() != null) {
                    payload.put("selectedAnswerIds", List.of(submission.getSelectedAnswerId()));
                }
            }
            case MULTI_CHOICE -> {
                if (submission.getSelectedAnswerIds() != null) {
                    payload.put("selectedAnswerIds", submission.getSelectedAnswerIds());
                }
            }
            case PLAIN_TEXT, ESSAY -> {
                if (submission.getText() != null) {
                    payload.put("text", submission.getText());
                }
            }
            case TABLE_CHOICE -> {
                if (submission.getRows() != null) {
                    payload.put("rows", submission.getRows());
                }
            }
        }

        return payload;
    }
}
