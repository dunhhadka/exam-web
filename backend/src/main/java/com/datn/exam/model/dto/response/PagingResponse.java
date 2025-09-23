package com.datn.exam.model.dto.response;

import com.datn.exam.model.dto.PageDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class PagingResponse<T> extends Response<List<T>> {
    private List<T> data;
    private int pageIndex;
    private int pageSize;
    private long total;
    private long totalPages;

    public PagingResponse(List<T> data, int pageIndex, int pageSize, long total, long totalPages) {
        this.data = data;
        this.pageIndex = pageIndex;
        this.pageSize = pageSize;
        this.total = total;
        this.totalPages = totalPages;
        this.success();
    }

    public static <T> PagingResponse<T> of(PageDTO<T> pageDTO) {
        return new PagingResponse<>(pageDTO.getData(), pageDTO.getPageIndex(), pageDTO.getPageSize(), pageDTO.getTotal(), pageDTO.getTotalPages());
    }
}
