package com.datn.exam.service.question.importfile;

import com.datn.exam.model.dto.request.AnswerCreateRequest;
import com.datn.exam.support.enums.QuestionType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OneChoiceQuestion extends BaseQuestionRow {
    private List<String> answersString;
    private Integer correctIndex;

    @Override
    public QuestionType getType() {
        return QuestionType.ONE_CHOICE;
    }

    @Override
    public List<AnswerCreateRequest> getAnswers() {
        return List.of();
    }
}
