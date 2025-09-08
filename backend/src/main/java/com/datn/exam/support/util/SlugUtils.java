package com.datn.exam.support.util;

import org.apache.commons.lang3.StringUtils;

import java.text.Normalizer;

public class SlugUtils {
    public static String getSlug(String input) {
        if (StringUtils.isNotBlank(input)) {
            String normalized = Normalizer.normalize(input, Normalizer.Form.NFC);
            String slug = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

            slug = slug.toLowerCase()
                    .replaceAll("[^a-z0-9\\s-]", "")
                    .replaceAll("\\s+", "-")
                    .replaceAll("-{2,}", "-")
                    .replaceAll("^-|-$", "");

            return slug;
        }

        return null;
    }
}
