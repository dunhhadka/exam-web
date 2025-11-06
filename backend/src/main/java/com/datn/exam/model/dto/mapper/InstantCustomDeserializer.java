package com.datn.exam.model.dto.mapper;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class InstantCustomDeserializer extends JsonDeserializer<Instant> {
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

    @Override
    public Instant deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        // fix tạm
        final ZoneOffset VIETNAM_OFFSET = ZoneOffset.ofHours(7);
        String text = p.getText();
        LocalDateTime localDateTime = LocalDateTime.parse(text, FORMATTER);
        ZonedDateTime zonedDateTime = localDateTime.atZone(VIETNAM_OFFSET);
        return zonedDateTime.toInstant();
    }
}
