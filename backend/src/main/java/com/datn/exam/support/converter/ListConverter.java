package com.datn.exam.support.converter;

import com.datn.exam.support.util.JsonUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.SneakyThrows;

import java.util.ArrayList;
import java.util.List;

@Converter
public class ListConverter <T> implements AttributeConverter<List<T>, String> {
    private static final TypeReference<List<Object>> LIST_TYPE = new TypeReference<>() {};

    @SneakyThrows
    @Override
    public String convertToDatabaseColumn(List<T> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        return JsonUtils.marshal(attribute);
    }

    @SneakyThrows
    @Override
    @SuppressWarnings("unchecked")
    public List<T> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new ArrayList<>();
        }
        return (List<T>) JsonUtils.unmarshal(dbData, LIST_TYPE);
    }
}
