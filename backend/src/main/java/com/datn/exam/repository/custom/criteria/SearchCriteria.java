package com.datn.exam.repository.custom.criteria;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SearchCriteria {
    private String key; // VD: firstName, lastName, id, email... : các field trong bảng hoặc field để join bảng
    private String operation; // =, >, <, like, >=, <=
    private String value; // Value tìm kiếm
}
