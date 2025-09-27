package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;

import java.math.BigDecimal;
import java.util.List;

public interface QuestionCreateBase {
    String getText();
    BigDecimal getPoint();
    QuestionType getType();
    Level getLevel();
    boolean isPublic();
    List<Long> getTagIds();
    List<AnswerCreateRequest> getAnswers();

    String getExpectedAnswer();
    Boolean getCaseSensitive();
    Boolean getExactMatch();


    Integer getMinWords();
    Integer getMaxWords();
    String getSimpleAnswer();
    String getGradingCriteria();


    List<String> getHeaders();
    List<QuestionCreateRequest.RowCompactRequest> getRows();
}