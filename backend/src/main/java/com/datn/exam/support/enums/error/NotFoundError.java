package com.datn.exam.support.enums.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum NotFoundError implements ResponseError {
    USER_NOT_FOUND(404001, "Không tìm thấy người dùng"),
    ROLE_NOT_FOUND(404002, "Không tìm thấy vai trò"),
    TAG_NOT_FOUND(404003, "Không tìm thấy thẻ với id: %s"),
    QUESTION_NOT_FOUND(404004, "Không tìm thấy câu hỏi với id: %s"),
    EXAM_NOT_FOUND(404005, "Không tìm thấy bài thi với id: %s"),
    EXAM_SESSION_NOT_FOUND(404006, "Không tìm thấy phiên thi với id: %s"),
    NO_ACTIVE_ATTEMPT(404007, "Không tìm thấy lượt thi đang hoạt động cho phiên thi này"),
    EXAM_ATTEMPT_NOT_FOUND(404008, "Không tìm thấy lượt thi"),
    WHITELIST_NOT_FOUND(404002, "Không tìm thấy whitelist");
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
