package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.Status;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ExamFilterRequest extends PagingRequest{
    private Boolean me;
    private Level level;
    private Status status;
    private Boolean publicFlag;
}
