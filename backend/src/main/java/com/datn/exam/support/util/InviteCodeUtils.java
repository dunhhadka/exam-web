package com.datn.exam.support.util;

import java.security.SecureRandom;
import java.util.UUID;

public final class InviteCodeUtils {
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RND = new SecureRandom();
    private static final String PATH = "/join/";

    public static String generate() {
        int len = 9;
        StringBuilder sb = new StringBuilder(len + 2);

        for (int i = 0; i < len; i++) {
            if (i > 0 && i % 3 == 0) sb.append('-');
            sb.append(ALPHABET.charAt(RND.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    public static String nextJoinToken() {return UUID.randomUUID().toString();};

    public static String nextJoinPath(String joinToken) {
        return PATH + joinToken;
    }
}
