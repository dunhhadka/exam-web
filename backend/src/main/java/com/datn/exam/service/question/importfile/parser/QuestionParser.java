package com.datn.exam.service.question.importfile.parser;

import com.datn.exam.model.entity.Answer;
import com.datn.exam.model.entity.Question;
import com.datn.exam.model.entity.Tag;
import com.datn.exam.service.impl.QuestionServiceImpl;
import com.datn.exam.service.question.importfile.BaseQuestionRow;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import com.datn.exam.support.enums.ActiveStatus;
import com.datn.exam.support.enums.Status;
import org.apache.commons.collections4.CollectionUtils;

import java.util.List;

public abstract class QuestionParser<T extends BaseQuestionRow> {

    private final QuestionServiceImpl questionService;

    protected QuestionParser(QuestionServiceImpl questionService) {
        this.questionService = questionService;
    }

    public abstract QuestionSheetType getSupportedType();

    public Question parse(T source) {
        var value = questionService.buildQuestionValue(source, Status.PUBLISHED);

        Question question = Question.builder()
                .point(source.getPoint())
                .text(source.getText())
                .isPublic(source.getIsPublic())
                .questionValue(value)
                .activeStatus(ActiveStatus.ACTIVE)
                .status(Status.PUBLISHED)
                .level(source.getLevel())
                .build();

        question.setAnswers(buildAnswers(source));
        question.setTags(buildTags(source));

        if (CollectionUtils.isNotEmpty(question.getAnswers())) {
            question.getAnswers().forEach(answer -> answer.setQuestion(question));
        }

        return question;
    }

    /**
     * TODO: chưa xử lý tag
     * */
    private List<Tag> buildTags(T source) {
        return List.of();
    }

    protected abstract List<Answer> buildAnswers(T source);
}
