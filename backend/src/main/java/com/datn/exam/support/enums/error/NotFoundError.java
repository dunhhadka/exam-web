package com.datn.exam.support.enums.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum NotFoundError implements ResponseError {
    USER_NOT_FOUND(404001, "User not found"),
    ROLE_NOT_FOUND(404002, "Role not found"),
    TAG_NOT_FOUND(400003, "Tag not found with ids: %s"),
    QUESTION_NOT_FOUND(400004, "Question not found with ids: %s"),
    EXAM_NOT_FOUND(400005, "Exam not found with ids: %s"),
    EXAM_SESSION_NOT_FOUND(400006, "Exam session not found with ids: %s"),
    NO_ACTIVE_ATTEMPT(400007, "No active attempt found for this exam session"),
    EXAM_ATTEMPT_NOT_FOUND(400008, "Exam attempt not found")
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
        return 404;
    }

    @Override
    public int getCode() {
        return code;
    }
}
