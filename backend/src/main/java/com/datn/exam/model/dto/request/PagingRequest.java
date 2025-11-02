package com.datn.exam.model.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.swing.*;

@EqualsAndHashCode(callSuper = true)
@Data
public class PagingRequest extends Request {
    protected String keyword;

    @Min(value = 0, message = "PAGE_INDEX_MIN")
    @Max(value = 200, message = "PAGE_INDEX_MAX")
    protected int pageIndex = 0;

    @Min(value = 1, message = "PAGE_SIZE_MIN")
    @Max(value = 200, message = "PAGE_SIZE_MAX")
    protected int pageSize = 10;

    protected long total;

    protected String sortBy;

    protected SortOrder sortOrder;

    public void setPageIndex(int pageIndex) {
        this.pageIndex = pageIndex - 1;
    }
}
