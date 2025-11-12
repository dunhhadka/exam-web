package com.datn.exam.model.dto.mapper;

import com.datn.exam.model.dto.request.ExamSessionRequest;
import com.datn.exam.model.dto.response.ExamSessionResponse;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.repository.data.dto.ExamSessionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = {DateMapper.class, ExamSessionSettingsMapper.class, InviteCodeMapper.class})
public abstract class ExamSessionMapper {
    public abstract ExamSessionResponse toExamSessionResponse(ExamSessionDto dto);

    @Mapping(source = "settings", target = "settings")
    @Mapping(source = "public", target = "publicFlag")
    @Mapping(source = "joinToken", target = "joinPath", qualifiedByName = "toJoinPath")
    @Mapping(source = "shuffleQuestions", target = "shuffleQuestion")
    public abstract ExamSessionResponse toExamSessionResponse(ExamSession examSession);

    @Mapping(target = "shuffleQuestions", source = "shuffleQuestion")
    public abstract void updateExamSession(@MappingTarget ExamSession examSession, ExamSessionRequest request);
}
