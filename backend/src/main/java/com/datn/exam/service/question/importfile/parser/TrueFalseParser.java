package com.datn.exam.service.question.importfile.parser;

import com.datn.exam.model.entity.Answer;
import com.datn.exam.service.impl.QuestionServiceImpl;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import com.datn.exam.service.question.importfile.TrueFalseQuestion;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TrueFalseParser extends QuestionParser<TrueFalseQuestion> {

    protected TrueFalseParser(QuestionServiceImpl questionService) {
        super(questionService);
    }

    @Override
    public QuestionSheetType getSupportedType() {
        return QuestionSheetType.TRUE_FALSE_SHEET;
    }

    @Override
    protected List<Answer> buildAnswers(TrueFalseQuestion source) {
        int correctIndex = source.getCorrectIndex();
        Answer trueAnswer = Answer.builder()
                .result(correctIndex == 0)
                .orderIndex(0)
                .build();
        Answer falseAnswer = Answer.builder()
                .result(correctIndex == 1)
                .orderIndex(1)
                .build();

        return List.of(trueAnswer, falseAnswer);
    }
}
