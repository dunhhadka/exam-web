package com.datn.exam.support.converter;

import com.datn.exam.support.util.JsonUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.SneakyThrows;

import java.util.Map;

@Converter
public class MapObjectConverter implements AttributeConverter<Map<String, Object>, String> {

    private final TypeReference<Map<String, Object>> MAP_OBJECT = new TypeReference<Map<String, Object>>() {
    };

    @SneakyThrows
    @Override
    public String convertToDatabaseColumn(Map<String, Object> attribute) {
        if (attribute == null) return null;
        return JsonUtils.marshal(attribute);
    }

    @SneakyThrows
    @Override
    public Map<String, Object> convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return JsonUtils.unmarshal(dbData, MAP_OBJECT);
    }
}
