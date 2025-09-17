package com.datn.exam.support.enums.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum BadRequestError implements ResponseError {
    LOGIN_FAILED(400001, "Login failed"),
    USERNAME_EXISTED(400002, "Username existed"),
    EMAIL_EXISTED(400003, "Email existed"),
    USER_WAS_INACTIVATED(400004, "User was inactivated"),
    USER_WAS_ACTIVATED(400005, "User was activated"),
    PASSWORD_MISS_MATCH(400006, "Password and confirm password not match"),
    INVALID_IDS(400007, "Ids must not be null or empty"),
    QUESTION_TEXT_REQUIRED(400008, "Question text is required"),
    QUESTION_SCORE_REQUIRED(400009, "Score is required"),
    QUESTION_TYPE_REQUIRED(400010, "Question type is required"),
    QUESTION_LEVEL_REQUIRED(400011, "Level is required"),
    QUESTION_IS_POSITIVE(400012, "Score must be positive"),
    QUESTION_MAX_SCORE(400013, "Score cannot exceed 999.99"),
    QUESTION_MAX_WORD(400014, "Max words must be at least 1"),
    QUESTION_MIN_WORD(400015, "Min words must be at least 1"),
    QUESTION_NOT_VALID(400016, "Question is not valid for publishing"),
    ANSWER_ORDER_INDEX_REQUIRED(400017,"Order index must not be null"),
    ANSWER_MIN_ORDER_INDEX(400018, "Answer orderIndex must be non-negative"),
    ANSWER_DUPLICATE_ORDER_INDEX(400019, "Duplicate orderIndex found: %s")
    ;

    private final int code;
    private final String message;

    @Override
    public String getName() {
        return name();
    }

    @Override
    public String getMessage() {
        return message;
    }

    @Override
    public int getStatus() {
        return 400;
    }

    @Override
    public int getCode() {
        return code;
    }
}
