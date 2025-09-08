package com.datn.exam.support.enums;

import lombok.Getter;

@Getter
public enum MediaType {
    IMAGE("image"),
    VIDEO("video"),
    AUDIO("audio");

    private final String value;

    MediaType(String value) {
        this.value = value;
    }

    public static MediaType fromContentType(String contentType) {
        if (contentType == null) return null;

        if (contentType.startsWith("image/")) return IMAGE;
        if (contentType.startsWith("video/")) return VIDEO;
        if (contentType.startsWith("audio/")) return AUDIO;

        return null;
    }
}
