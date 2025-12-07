package com.datn.exam.service.question.importfile;

import com.datn.exam.model.dto.request.AnswerCreateRequest;
import com.datn.exam.support.enums.QuestionType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MultiChoiceQuestion extends BaseQuestionRow {

    private List<String> answersString;
    private List<Integer> correctIndexes;

    @Override
    public QuestionType getType() {
        return QuestionType.MULTI_CHOICE;
    }

    @Override
    public List<AnswerCreateRequest> getAnswers() {
        return List.of();
    }
}
