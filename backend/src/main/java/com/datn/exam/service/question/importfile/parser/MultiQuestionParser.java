package com.datn.exam.service.question.importfile.parser;

import com.datn.exam.model.entity.Answer;
import com.datn.exam.service.impl.QuestionServiceImpl;
import com.datn.exam.service.question.importfile.MultiChoiceQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.IntStream;

@Component
public class MultiQuestionParser extends QuestionParser<MultiChoiceQuestion> {
    protected MultiQuestionParser(QuestionServiceImpl questionService) {
        super(questionService);
    }

    @Override
    public QuestionSheetType getSupportedType() {
        return QuestionSheetType.MULTI_CHOICE_SHEET;
    }

    @Override
    protected List<Answer> buildAnswers(MultiChoiceQuestion source) {
        List<Integer> correctIndexes = source.getCorrectIndexes();
        return IntStream.range(0, source.getAnswersString().size())
                .mapToObj(index -> buildAnswers(
                        index,
                        source.getAnswersString().get(index),
                        correctIndexes
                ))
                .toList();
    }

    private Answer buildAnswers(
            int index,
            String answer,
            List<Integer> correctIndexes) {

        return Answer.builder()
                .orderIndex(index)
                .value(answer)
                .result(correctIndexes.contains(index))
                .build();
    }
}
