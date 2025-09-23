package com.datn.exam.support.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum QuestionType {
    ONE_CHOICE,
    MULTI_CHOICE,
    PLAIN_TEXT,
    ESSAY,
    TRUE_FALSE,
    TABLE_CHOICE;
}
