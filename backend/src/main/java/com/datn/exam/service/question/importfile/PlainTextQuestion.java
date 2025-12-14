package com.datn.exam.service.question.importfile;

import com.datn.exam.model.dto.request.AnswerCreateRequest;
import com.datn.exam.support.enums.QuestionType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PlainTextQuestion extends BaseQuestionRow {

    private String expectedAnswer;
    private Boolean extractMatch;
    private Boolean caseSensitive;

    @Override
    public QuestionType getType() {
        return QuestionType.PLAIN_TEXT;
    }

    @Override
    public List<AnswerCreateRequest> getAnswers() {
        return List.of();
    }

    @Override
    public Boolean getExactMatch() {
        return extractMatch;
    }

    @Override
    public Boolean getCaseSensitive() {
        return caseSensitive;
    }
}
