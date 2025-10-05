package com.datn.exam.model.dto.mapper;

import com.datn.exam.support.util.InviteCodeUtils;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface InviteCodeMapper {
    @Named("toJoinPath")
    default String toJoinPath(String token) {
        if (token == null) return null;
        return InviteCodeUtils.nextJoinPath(token);
    }
}