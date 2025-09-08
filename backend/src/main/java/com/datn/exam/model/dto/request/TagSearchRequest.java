package com.datn.exam.model.dto.request;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class TagSearchRequest extends PagingRequest{
    private List<Long> tagIds;
}
