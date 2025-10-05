package com.datn.exam.support.util;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

public final class OtpUtils {
    private static final SecureRandom RND = new SecureRandom();
    private OtpUtils() {};

    public static String generate6() {
        int n = 100000 + RND.nextInt(900000);
        return Integer.toString(n);
    }

    public static String randomSalt(int bytes) {
        byte[] b = new byte[bytes];
        RND.nextBytes(b);
        return HexFormat.of().formatHex(b);
    }

    public static String hash(String otp, String salt) {
        try {
            var md = MessageDigest.getInstance("SHA-256");
            md.update(salt.getBytes());
            md.update(otp.getBytes());

            return HexFormat.of().formatHex(md.digest());
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public static boolean matches(String rawOtp, String salt, String hash) {
        return hash(rawOtp, salt).equals(hash);
    }
}
