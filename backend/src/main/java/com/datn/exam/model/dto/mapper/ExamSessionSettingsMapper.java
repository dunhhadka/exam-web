package com.datn.exam.model.dto.mapper;

import com.datn.exam.model.dto.ExamSessionSetting;
import com.datn.exam.support.util.JsonUtils;
import lombok.SneakyThrows;
import org.mapstruct.Mapper;

import java.util.Map;

@Mapper(componentModel = "spring")
public interface ExamSessionSettingsMapper {

    @SneakyThrows
    default ExamSessionSetting toSetting(Map<String, Object> settings) {
        if (settings == null) return null;
        String json = JsonUtils.marshal(settings);
        return JsonUtils.unmarshal(json, ExamSessionSetting.class);
    }

    @SneakyThrows
    default Map<String, Object> toMap(ExamSessionSetting s) {
        if (s == null) return null;
        String json = JsonUtils.marshal(s);
        return JsonUtils.toMap(json);
    }
}
