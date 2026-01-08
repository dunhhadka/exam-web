package com.datn.exam.support.converter;

import com.datn.exam.model.entity.Question;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Converter
@RequiredArgsConstructor
@Slf4j
public class BaseQuestionConverter implements AttributeConverter<Question.BaseQuestion, String> {

    private final ObjectMapper objectMapper;

    @Override
    public String convertToDatabaseColumn(Question.BaseQuestion baseQuestion) {
        if (baseQuestion == null) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(baseQuestion);
        } catch (JsonProcessingException e) {
            log.error("Error converting BaseQuestion to JSON", e);
            throw new IllegalArgumentException("Error converting BaseQuestion to JSON", e);
        }
    }

    @Override
    public Question.BaseQuestion convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(dbData, Question.BaseQuestion.class);
        } catch (JsonProcessingException e) {
            log.error("Error converting JSON to BaseQuestion: {}", dbData, e);
            throw new IllegalArgumentException("Error converting JSON to BaseQuestion", e);
        }
    }
}
