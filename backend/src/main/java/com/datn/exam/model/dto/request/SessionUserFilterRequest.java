package com.datn.exam.model.dto.request;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SessionUserFilterRequest extends PagingRequest {
    private String searchText;
    private String role;
    private String gender;
    private String status;
}
