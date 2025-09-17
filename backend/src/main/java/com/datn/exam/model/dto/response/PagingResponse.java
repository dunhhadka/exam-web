package com.datn.exam.model.dto.response;

import com.datn.exam.model.dto.PageDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class PagingResponse<T> extends Response<List<T>> {
    private int pageIndex;
    private int pageSize;
    private long total;

    public PagingResponse(List<T> data, int pageIndex, int pageSize, long total) {
        this.data = data;
        this.pageIndex = pageIndex;
        this.pageSize = pageSize;
        this.total = total;

        this.success();
    }

    public static <T> PagingResponse<T> of(PageDTO<T> pageDTO) {
        return new PagingResponse<>(pageDTO.getData(), pageDTO.getPageIndex(), pageDTO.getPageIndex(), pageDTO.getTotal());
    }
}
