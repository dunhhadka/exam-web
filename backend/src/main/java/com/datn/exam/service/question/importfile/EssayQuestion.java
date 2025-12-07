package com.datn.exam.service.question.importfile;

import com.datn.exam.model.dto.request.AnswerCreateRequest;
import com.datn.exam.support.enums.QuestionType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class EssayQuestion extends BaseQuestionRow {

    private Integer minWords;
    private Integer maxWords;
    private String simpleAnswer;
    private String gradingCriteria;

    @Override
    public QuestionType getType() {
        return QuestionType.ESSAY;
    }

    @Override
    public List<AnswerCreateRequest> getAnswers() {
        return List.of();
    }

    @Override
    public Integer getMinWords() {
        return minWords;
    }

    @Override
    public Integer getMaxWords() {
        return maxWords;
    }

    @Override
    public String getSimpleAnswer() {
        return simpleAnswer;
    }

    @Override
    public String getGradingCriteria() {
        return gradingCriteria;
    }
}
