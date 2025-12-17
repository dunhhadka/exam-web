package com.datn.exam.support.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.StringUtils;

import java.util.Base64;
import java.util.Map;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class CursorCodeUtils {

    private static final String CURSOR_DELIMITER = ":";

    public static String encode(Object id) {
        String raw = String.format("%s", id);

        return Base64.getEncoder().encodeToString(raw.getBytes());
    }

    /**
     * Decode va tra ve cac properties
     */
    public static Map<String, Object> decode(String cursor) {
        if (StringUtils.isBlank(cursor)) {
            throw ExceptionUtils.withMessage("Cursor is required");
        }

        try {
            String raw = new String(Base64.getDecoder().decode(cursor.getBytes()));
            String[] parts = raw.split(CURSOR_DELIMITER);

            return Map.of(
                    "id", parts[0]
            );
        } catch (Exception e) {
            throw ExceptionUtils.withMessage("Invalid cursor format");
        }
    }
}
