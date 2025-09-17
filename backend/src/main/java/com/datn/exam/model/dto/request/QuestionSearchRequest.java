package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class QuestionSearchRequest extends PagingRequest{
    private QuestionType type;
    private Level level;
    private Boolean isPublic;
    private String tagName;
    private Status status;
}
