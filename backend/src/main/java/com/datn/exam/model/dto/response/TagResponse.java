package com.datn.exam.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class TagResponse {
    private Long id;
    private String name;
    private String slug;
    private String colorCode;
}
