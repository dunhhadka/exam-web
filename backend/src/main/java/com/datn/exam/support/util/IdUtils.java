package com.datn.exam.support.util;

import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

public class IdUtils {
    private static final Pattern UUID_REGEX = Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

    public static UUID nextId() {
        return UUID.randomUUID();
    }

    public static UUID convertStringToUUID(String id) {
        return checkingIdIsUUID(id) ? UUID.fromString(id) : null;
    }

    public static String convertUUIDToString(UUID id) {
        return Objects.nonNull(id) ? id.toString() : null;
    }

    private static boolean checkingIdIsUUID(String id) {
        return !id.isBlank() && UUID_REGEX.matcher(id).matches();
    }
}
