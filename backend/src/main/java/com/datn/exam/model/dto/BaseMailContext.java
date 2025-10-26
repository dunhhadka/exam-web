package com.datn.exam.model.dto;

import java.util.Map;

public interface BaseMailContext {
    String getTemplateName();
    String getSubject();
    String getTo();
    Map<String, Object> toVariables();
}