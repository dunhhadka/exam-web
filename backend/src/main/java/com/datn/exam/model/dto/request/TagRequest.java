package com.datn.exam.model.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class TagRequest extends Request{
    @Size(max = 100)
    private String name;

    @Size(max = 20, message = "TAG_SIZE_MAX")
    private String colorCode;
}
