package com.datn.exam.support.constants;

public interface ValidateConstraint {
    public static final class Length {
        public static final int CODE_MAX_LENGTH = 36;
        public static final int FIRST_NAME_MIN_LENGTH = 2;
        public static final int FIRST_NAME_MAX_LENGTH = 50;
        public static final int LAST_NAME_MIN_LENGTH = 2;
        public static final int LAST_NAME_MAX_LENGTH = 50;
        public static final int NAME_MAX_LENGTH = 100;
        public static final int EMAIL_MAX_LENGTH = 50;
        public static final int PHONE_MAX_LENGTH = 20;
        public static final int ADDRESS_MAX_LENGTH = 200;
        public static final int PASSWORD_MIN_LENGTH = 6;
        public static final int PASSWORD_MAX_LENGTH = 50;
        public static final int QUESTION_MAX_LENGTH = 1;
        public static final int QUESTION_MIN_LENGTH = 1;
        public static final int ANSWER_MAX_VALUE = 2000;
        public static final int ANSWER_MIN_ORDER_INDEX = 0;
        public static final int ANSWER_MAX_EXPLANATION = 2000;
        public static final int ANSWER_MAX_EXPLANATION_HTML = 2000;
    }

    public static final class Format {
        public static final String FIRST_NAME_PATTERN = "^[\\p{L}' -]+$";
        public static final String LAST_NAME_PATTERN  = "^[\\p{L}' -]+$";
        public static final String PHONE_NUMBER_PATTERN = "^(\\+[0-9]+[\\- \\.]*)?(\\([0-9]+\\)[\\- \\.]*)?([0-9][0-9\\- \\.]+[0-9])$";
        public static final String EMAIL_PATTERN = "^(\\s){0,}[a-zA-Z0-9-_\\.]{1,50}[a-zA-Z0-9]{1,50}@[a-zA-Z0-9_-]{2,}(\\.[a-zA-Z0-9]{2,4}){1,2}(\\s){0,}$";
        public static final String CODE_PATTERN = "^[A-Za-z0-9_.]{4,50}$";
        public static final String WEBSITE = "((http|https)?:\\/\\/)?[-a-zA-Z0-9]{1,}\\.((\\-?[a-zA-Z0-9])+\\.)*([a-zA-Z0-9]+\\-?)*([a-zA-Z0-9]+)*(\\/[^\\s]*)?";
        public static final String ACCOUNT_NUMBER = "^(\\d{3,20})$";
        public static final String MONTH_YEAR_PATTERN = "^((0[1-9])|(1[0-2]))\\/(\\d{4})$";
        public static final String NORM_3_DATE_PATTERN = "^([0-2][0-9]|3[0-1])\\/(0[0-9]|1[0-2])\\/([0-9][0-9])?[0-9][0-9]$";
        public static final String SPECIAL_CHARACTER = "[^a-zA-Z0-9]";
        public static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&^()_=+-{}~|'\"]{8,99}$";
    }
}
