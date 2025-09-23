package com.datn.exam.model.dto;

import lombok.Data;

import java.util.Collections;
import java.util.List;

@Data
public class PageDTO<T> {
    private List<T> data;
    private int pageIndex;
    private int pageSize;
    private long total;
    private long totalPages;

    public PageDTO(List<T> data, int pageIndex, int pageSize, long total) {
        this.data = data;
        this.pageIndex = pageIndex;
        this.pageSize = pageSize;
        this.total = total;
        this.totalPages = (pageSize == 0) ? 0 : (total + pageSize - 1) / pageSize;
    }

    public static <T> PageDTO<T> of(List<T> data, int pageIndex, int pageSize, long total) {
        return new PageDTO<>(data, pageIndex, pageSize, total);
    }

    public static <T> PageDTO<T> empty(int pageIndex, int pageSize) {
        return new PageDTO<>(Collections.emptyList(), pageIndex, pageSize, 0L);
    }
}
