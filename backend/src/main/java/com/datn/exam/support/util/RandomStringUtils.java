package com.datn.exam.support.util;

import java.security.SecureRandom;

public class RandomStringUtils {
    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generateOtp(int length) {
        return RANDOM.ints(0, 10)
                .limit(length)
                .collect(StringBuilder::new, StringBuilder::append, StringBuilder::append)
                .toString();
    }
}
