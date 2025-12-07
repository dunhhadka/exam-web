package com.datn.exam.service.question.importfile.parser;

import com.datn.exam.model.entity.Answer;
import com.datn.exam.service.impl.QuestionServiceImpl;
import com.datn.exam.service.question.importfile.PlainTextQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PlainTextParser extends QuestionParser<PlainTextQuestion> {
    protected PlainTextParser(QuestionServiceImpl questionService) {
        super(questionService);
    }

    @Override
    public QuestionSheetType getSupportedType() {
        return QuestionSheetType.PLAIN_TEXT_SHEET;
    }

    @Override
    protected List<Answer> buildAnswers(PlainTextQuestion source) {
        return List.of();
    }
}
