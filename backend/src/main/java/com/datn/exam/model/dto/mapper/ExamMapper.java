package com.datn.exam.model.dto.mapper;

import com.datn.exam.model.dto.request.ExamUpdateRequest;
import com.datn.exam.model.dto.response.ExamResponse;
import com.datn.exam.model.entity.Exam;
import com.datn.exam.repository.data.dto.ExamDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = {DateMapper.class})
public abstract class ExamMapper {
    public abstract ExamResponse toExamResponse(Exam exam);

    @Mapping(target = "isPublic", source = "publicFlag")
    public abstract ExamResponse toExamResponse(ExamDto dto);

    public abstract Exam updateExam(@MappingTarget Exam exam, ExamUpdateRequest request);
}
