package com.datn.exam.repository.data.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class TableChoiceValue {
    private List<String> headers;
    private List<QuestionDto.RowCompactDto> rows;
}
