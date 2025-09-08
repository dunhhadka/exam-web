package com.datn.exam.model.dto.request;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class IdsRequest extends Request{
    private List<Long> ids;
}
