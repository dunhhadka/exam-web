package com.datn.exam.service.question.importfile;

import com.datn.exam.model.dto.request.AnswerCreateRequest;
import com.datn.exam.support.enums.QuestionType;

import java.util.List;

public class TableChoiceQuestion extends BaseQuestionRow {

    @Override
    public QuestionType getType() {
        return null;
    }

    @Override
    public List<AnswerCreateRequest> getAnswers() {
        return List.of();
    }
}
