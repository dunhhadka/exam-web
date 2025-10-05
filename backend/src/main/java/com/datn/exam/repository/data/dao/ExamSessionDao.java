package com.datn.exam.repository.data.dao;

import com.datn.exam.model.dto.request.ExamSessionFilterRequest;
import com.datn.exam.repository.data.dto.ExamSessionDto;

import java.util.List;

public interface ExamSessionDao {
    Long count(ExamSessionFilterRequest request);
    public List<ExamSessionDto> search(ExamSessionFilterRequest request);
}
