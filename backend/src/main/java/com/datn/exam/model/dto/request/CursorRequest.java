package com.datn.exam.model.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CursorRequest {
    private static final int MAX_SIZE = 15;
    private static final int DEFAULT_SIZE = 6;

    private String cursor;
    private Integer limit;

    public Integer getLimit() {
        return limit != null ? Math.min(limit, MAX_SIZE) : DEFAULT_SIZE;
    }
}
