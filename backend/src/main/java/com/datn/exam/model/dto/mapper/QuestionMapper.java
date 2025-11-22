package com.datn.exam.model.dto.mapper;

import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.entity.Question;
import com.datn.exam.repository.data.dto.QuestionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = {DateMapper.class})
public abstract class QuestionMapper {
    @Mapping(target = "headers", expression = "java(mapHeaders(question))")
    @Mapping(target = "rows", expression = "java(mapRows(question))")
    @Mapping(target = "expectedAnswer", expression = "java(mapExpectedAnswer(question))")
    @Mapping(target = "caseSensitive", expression = "java(mapCaseSensitive(question))")
    @Mapping(target = "exactMatch", expression = "java(mapExactMatch(question))")
    @Mapping(target = "minWords", expression = "java(mapMinWords(question))")
    @Mapping(target = "maxWords", expression = "java(mapMaxWords(question))")
    @Mapping(target = "answerAnswer", expression = "java(mapSimpleAnswer(question))")
    @Mapping(target = "gradingCriteria", expression = "java(mapGradingCriteria(question))")
    public abstract QuestionResponse toQuestionResponse(Question question);

    @Mapping(target = "isPublic", source = "publicFlag")
    @Mapping(target = "answers", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "expectedAnswer", ignore = true)
    @Mapping(target = "caseSensitive", ignore = true)
    @Mapping(target = "exactMatch", ignore = true)
    @Mapping(target = "minWords", ignore = true)
    @Mapping(target = "maxWords", ignore = true)
    @Mapping(target = "answerAnswer", ignore = true)
    @Mapping(target = "gradingCriteria", ignore = true)
    public abstract QuestionResponse toQuestionResponse(QuestionDto dto);

    protected List<String> mapHeaders(Question question) {
        if (question.getQuestionValue() instanceof Question.TableChoiceQuestion tableChoice) {
            return tableChoice.getHeaders();
        }
        return null;
    }

    protected List<QuestionResponse.RowCompactResponse> mapRows(Question question) {
        if (question.getQuestionValue() instanceof Question.TableChoiceQuestion tableChoice) {
            return tableChoice.getRows().stream()
                    .map(r -> new QuestionResponse.RowCompactResponse(r.getLabel(), r.getCorrectIndex()))
                    .toList();
        }
        return null;
    }

    protected String mapExpectedAnswer(Question question) {
        if (question.getQuestionValue() instanceof Question.PlainTextQuestion plainText) {
            return plainText.getExpectedAnswer();
        }
        return null;
    }

    protected Boolean mapCaseSensitive(Question question) {
        if (question.getQuestionValue() instanceof Question.PlainTextQuestion plainText) {
            return plainText.getCaseSensitive();
        }
        return null;
    }

    protected Boolean mapExactMatch(Question question) {
        if (question.getQuestionValue() instanceof Question.PlainTextQuestion plainText) {
            return plainText.getExactMatch();
        }
        return null;
    }

    protected Integer mapMinWords(Question question) {
        if (question.getQuestionValue() instanceof Question.EssayQuestion essay) {
            return essay.getMinWords();
        }
        return null;
    }

    protected Integer mapMaxWords(Question question) {
        if (question.getQuestionValue() instanceof Question.EssayQuestion essay) {
            return essay.getMaxWords();
        }
        return null;
    }

    protected String mapSimpleAnswer(Question question) {
        if (question.getQuestionValue() instanceof Question.EssayQuestion essay) {
            return essay.getSampleAnswer();
        }
        return null;
    }

    protected String mapGradingCriteria(Question question) {
        if (question.getQuestionValue() instanceof Question.EssayQuestion essay) {
            return essay.getGradingCriteria();
        }
        return null;
    }
}
