package com.datn.exam.model.dto.request;

import java.math.BigDecimal;

public interface QuestionRequestInterface {
    Long getId();
    BigDecimal getPoint();
    Integer getOrderIndex();
}