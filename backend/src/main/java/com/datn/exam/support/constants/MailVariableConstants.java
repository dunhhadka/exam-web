package com.datn.exam.support.constants;

import java.util.regex.Pattern;

public final class MailVariableConstants {
    private MailVariableConstants() {}

    public static final String EXAM_OTP_MAIL_TEMPLATE = "exam-otp-template";

    public static final String EMAIL_BODY = "emailBody";
    public static final String OTP = "otp";
    public static final String EXPIRES_MINUTES = "expiresMinutes";
    public static final String DURATION_MINUTES = "durationMinutes";
    public static final String LATE_JOIN_MINUTES = "lateJoinMinutes";
    public static final String USER_NAME = "userName";

    public static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    public static final String RESULT_MAIL_TEMPLATE = "mail-notification-result-template";
}
