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
    public abstract QuestionResponse toQuestionResponse(Question question);

    @Mapping(target = "isPublic", source = "publicFlag")
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
}
