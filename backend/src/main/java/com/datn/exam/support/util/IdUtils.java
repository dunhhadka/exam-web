package com.datn.exam.support.util;

import java.nio.ByteBuffer;
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


    public static byte[] uuidToBytes(UUID id) {
        var bb = java.nio.ByteBuffer.wrap(new byte[16]);
        bb.putLong(id.getMostSignificantBits());
        bb.putLong(id.getLeastSignificantBits());
        return bb.array();
    }
}
