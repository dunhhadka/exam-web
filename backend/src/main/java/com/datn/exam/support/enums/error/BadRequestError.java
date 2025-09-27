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
    QUESTION_POINT_REQUIRED(400009, "Point is required"),
    QUESTION_TYPE_REQUIRED(400010, "Question type is required"),
    QUESTION_LEVEL_REQUIRED(400011, "Level is required"),
    QUESTION_IS_POSITIVE(400012, "Point must be positive"),
    QUESTION_MAX_SCORE(400013, "Score cannot exceed 999.99"),
    QUESTION_MAX_WORD(400014, "Max words must be at least 1"),
    QUESTION_MIN_WORD(400015, "Min words must be at least 1"),
    QUESTION_NOT_VALID(400016, "Question is not valid for publishing"),
    QUESTION_TYPE_REQUIRE(400020, "Question type is required"),
    QUESTION_ROW_LABEL_REQUIRED(400021, "Question row label is required"),
    QUESTION_ROW_CORRECT_INDEX_REQUIRED(400022, "Question row correct index is required"),
    QUESTION_ROW_CORRECT_INDEX_INVALID(400023, "Question row correct index is invalid: %s"),
    QUESTION_HEADERS_REQUIRED(400025, "Question headers are required"),
    QUESTION_HEADERS_SIZE_INVALID(400026, "Number of headers must be between 2 and 20"),
    QUESTION_ROWS_REQUIRED(400027, "Question rows are required"),
    QUESTION_ROWS_SIZE_INVALID(400028, "Number of rows must be between 1 and 20"),
    QUESTION_TABLE_HEADER_MIN_2(400029, "Table choice question must have at least 2 headers"),
    QUESTION_TABLE_HEADER_REQUIRED(400030, "Table choice header at index %s is required"),
    QUESTION_TABLE_ROW_MIN_1(400031, "Table choice question must have at least 1 row"),
    QUESTION_ROW_EMPTY(400032, "Question row at index %s must not be null"),
    QUESTION_TRUE_FALSE_REQUIRE_2_ANSWERS(400033, "True/False question must have exactly 2 answers"),
    ANSWER_MIN_TWO_REQUIRE(400034, "Choice question must have at least 2 answers"),
    ANSWER_ORDER_INDEX_INVALID(400035, "Answer orderIndex must be non-negative"),
    ANSWER_TEXT_REQUIRED(400036, "Answer text is required"),
    ANSWER_REQUIRE_EXACTLY_ONE_CORRECT(400037, "Question must have exactly one correct answer"),
    ANSWER_REQUIRE_AT_LEAST_ONE_CORRECT(400038, "Question must have at least one correct answer"),
    ANSWER_ORDER_INDEX_REQUIRED(400017,"Order index must not be null"),
    ANSWER_MIN_ORDER_INDEX(400018, "Answer orderIndex must be non-negative"),
    ANSWER_DUPLICATE_ORDER_INDEX(400019, "Duplicate orderIndex found: %s"),
    ANSWER_MIN_ONE_REQUIRE(400021, "Answer must contain at least one item"),
    ANSWER_REQUIRE_CORRECT(400022, "At least one correct answer is required"),
    EXAM_NAME_REQUIRED(400050, "Exam name is required"),
    EXAM_LEVEL_REQUIRED(400051, "Exam level is required"),
    EXAM_QUESTIONS_REQUIRED(400052, "Questions list must not be null or empty"),
    EXAM_QUESTION_ID_REQUIRED(400053, "Question id is required"),
    EXAM_QUESTION_POINT_REQUIRED(400054, "Question point is required"),
    EXAM_MIN_SCORE(400055, "Exam score must be positive")
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
