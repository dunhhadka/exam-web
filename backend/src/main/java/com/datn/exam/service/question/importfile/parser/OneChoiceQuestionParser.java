package com.datn.exam.service.question.importfile.parser;

import com.datn.exam.model.entity.Answer;
import com.datn.exam.service.impl.QuestionServiceImpl;
import com.datn.exam.service.question.importfile.OneChoiceQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.IntStream;

@Component
public class OneChoiceQuestionParser extends QuestionParser<OneChoiceQuestion> {

    protected OneChoiceQuestionParser(QuestionServiceImpl questionService) {
        super(questionService);
    }

    @Override
    public QuestionSheetType getSupportedType() {
        return QuestionSheetType.ONE_CHOICE_SHEET;
    }

    @Override
    protected List<Answer> buildAnswers(OneChoiceQuestion source) {
        int correctIndex = source.getCorrectIndex();
        return IntStream.range(0, source.getAnswersString().size())
                .mapToObj(index ->
                        buildAnswer(
                                index,
                                source.getAnswersString().get(index),
                                correctIndex
                        ))
                .toList();

    }

    private Answer buildAnswer(int index, String answer, int correctIndex) {
        return Answer.builder()
                .orderIndex(index)
                .value(answer)
                .result(index == correctIndex)
                .build();
    }
}
