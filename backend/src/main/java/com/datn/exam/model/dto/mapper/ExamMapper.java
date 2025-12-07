package com.datn.exam.model.dto.mapper;

import com.datn.exam.model.dto.request.ExamUpdateRequest;
import com.datn.exam.model.dto.response.ExamResponse;
import com.datn.exam.model.entity.Exam;
import com.datn.exam.model.entity.ExamQuestion;
import com.datn.exam.repository.data.dto.ExamDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = {DateMapper.class})
public abstract class ExamMapper {

    @Mapping(target = "examQuestion", source = "examQuestions")
    public abstract ExamResponse toExamResponse(Exam exam);

    @Mapping(target = "text", source = "question.text")
    @Mapping(target = "point", source = "question.point")
    @Mapping(target = "level", source = "question.level")
    @Mapping(target = "type", source = "question.type")
    public abstract ExamResponse.ExamQuestionResponse map(ExamQuestion source);

    @Mapping(target = "isPublic", source = "publicFlag")
    public abstract ExamResponse toExamResponse(ExamDto dto);

    public abstract Exam updateExam(@MappingTarget Exam exam, ExamUpdateRequest request);
}
