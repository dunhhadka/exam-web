package com.datn.exam.service.question.importfile.parser;

import com.datn.exam.model.entity.Answer;
import com.datn.exam.service.impl.QuestionServiceImpl;
import com.datn.exam.service.question.importfile.EssayQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EssayQuestionParser extends QuestionParser<EssayQuestion> {

    protected EssayQuestionParser(QuestionServiceImpl questionService) {
        super(questionService);
    }

    @Override
    public QuestionSheetType getSupportedType() {
        return QuestionSheetType.ESSAY_SHEET;
    }

    @Override
    protected List<Answer> buildAnswers(EssayQuestion source) {
        return List.of();
    }
}
