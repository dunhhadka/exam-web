package com.datn.exam.repository.data.dao;

import com.datn.exam.model.dto.request.ExamFilterRequest;
import com.datn.exam.repository.data.dto.ExamDto;
import com.datn.exam.repository.data.dto.QuestionDto;

import java.util.List;

public interface ExamDao {
    Long count(ExamFilterRequest request);

    public List<ExamDto> search(ExamFilterRequest request);

    List<ExamDto> findByIds(List<Long> ids);
}
