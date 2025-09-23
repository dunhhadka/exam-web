package com.datn.exam.repository.data.dao;

import com.datn.exam.model.dto.request.QuestionSearchRequest;
import com.datn.exam.repository.data.dto.QuestionDto;

import java.util.List;

public interface QuestionDao {
    Long count(QuestionSearchRequest request);

    public List<QuestionDto> search(QuestionSearchRequest request);

//    List<QuestionDto> findByIds(List<Long> ids);
}
