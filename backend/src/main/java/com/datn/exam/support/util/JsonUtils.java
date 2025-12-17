package com.datn.exam.support.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.NoArgsConstructor;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@NoArgsConstructor
public class JsonUtils {
    private static final ObjectMapper mapper = createObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    public static ObjectMapper createObjectMapper() {
        var mapper = new ObjectMapper();
        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        mapper.registerModule(new JavaTimeModule());

        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        return mapper;
    }

    public static <T> T unmarshal(InputStream inputStream, Class<T> clazz) throws IOException {
        return mapper.readValue(inputStream, clazz);
    }

    public static String marshal(Object object) throws JsonProcessingException {
        return mapper.writeValueAsString(object);
    }

    public static <T> T unmarshal(String string, TypeReference<T> reference) throws JsonProcessingException {
        return mapper.readValue(string, reference);
    }

    public static <T> T unmarshal(String string, Class<T> clazz) throws JsonProcessingException {
        return mapper.readValue(string, clazz);
    }

    public static Map<String, Object> toMap(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return mapper.readValue(json, MAP_TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot parse json to map", e);
        }
    }

    public static Map<String, Object> toMap(Object obj) {
        if (obj == null) return Collections.emptyMap();
        try {
            Map<String, Object> raw = mapper.convertValue(obj, MAP_TYPE);
            return raw == null ? new LinkedHashMap<>() : raw;
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Cannot convert object to map", e);
        }
    }

    public static <T> T toObject(Map<String, Object> map, Class<T> clazz) {
        if (map == null) return null;
        return mapper.convertValue(map, clazz);
    }
}
