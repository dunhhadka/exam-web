package com.datn.exam.support.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum QuestionType {
    ONE_CHOICE("one_choice"),
    MULTI_CHOICE("multi_choice"),
    PLAIN_TEXT("plain_text"),
    ESSAY("essay"),
    TRUE_FALSE("true_false"),
    TABLE_CHOICE("table_choice");

    private final String value;

    QuestionType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static QuestionType fromValue(String value) {
        for (QuestionType type : values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown value: " + value);
    }
}
