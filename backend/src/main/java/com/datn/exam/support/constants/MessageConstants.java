package com.datn.exam.support.constants;

public final class MessageConstants {
    private MessageConstants(){};

    public static final String SESSION_NOT_STARTED =
            "The exam session has not started yet. Please come back once it begins.";

    public static final String SESSION_ENDED =
            "The exam session has ended or the joining time window has passed.";

    public static final String SESSION_CLOSED =
            "This exam session is closed. You cannot join at this time.";

    public static final String ATTEMPT_LIMIT_REACHED =
            "You have reached the maximum number of attempts. Cannot start a new attempt.";

    public static final String PREFIX_SUBJECT = "Mã OTP tham gia bài thi";

}
