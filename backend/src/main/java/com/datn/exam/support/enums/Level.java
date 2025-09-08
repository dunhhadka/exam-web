package com.datn.exam.support.enums;

import lombok.Getter;

@Getter
public enum Level {
    EASY("easy"),
    NORMAL("normal"),
    MEDIUM("medium"),
    DIFFICULT("difficult");

    private final String value;

    Level(String value) {
        this.value = value;
    }
}
