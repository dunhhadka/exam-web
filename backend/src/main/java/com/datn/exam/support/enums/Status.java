package com.datn.exam.support.enums;

import lombok.Getter;

@Getter
public enum Status {
    DRAFT("draft"),
    PUBLISHED("published"),
    ARCHIVED("archived");

    private final String value;

    Status(String value) {
        this.value = value;
    }
}
