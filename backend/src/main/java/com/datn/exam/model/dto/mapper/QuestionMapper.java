package com.datn.exam.model.dto.mapper;

import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.entity.Question;
import com.datn.exam.repository.data.dto.QuestionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {DateMapper.class})
public abstract class QuestionMapper {
    public abstract QuestionResponse toQuestionResponse(Question question);

    @Mapping(target = "isPublic", source = "publicFlag")
    public abstract QuestionResponse toQuestionResponse(QuestionDto dto);
}
