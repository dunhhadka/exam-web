package com.datn.exam.model.dto.mapper;

import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.entity.Question;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public abstract class QuestionMapper {
    public abstract QuestionResponse toQuestionResponse(Question question);
}
