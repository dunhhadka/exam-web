package com.datn.exam.support.util;

import com.datn.exam.support.constants.MessageConstants;

public class StringUtils {
    public static String normalize(String text, Boolean caseSensitive) {
        if (text == null) return "";
        String normalized = text.trim().replaceAll("\\s+", " ");
        return Boolean.TRUE.equals(caseSensitive) ? normalized : normalized.toLowerCase();
    }

    public static String buildSubject(String sessionCode) {
        return String.format("%s %s", MessageConstants.PREFIX_SUBJECT, sessionCode);
    }
}
