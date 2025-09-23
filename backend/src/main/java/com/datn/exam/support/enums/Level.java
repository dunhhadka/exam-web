package com.datn.exam.support.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum Level {
    EASY,
    NORMAL,
    MEDIUM,
    DIFFICULT;
}
