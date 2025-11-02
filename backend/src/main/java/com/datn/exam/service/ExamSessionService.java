package com.datn.exam.service;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.request.ExamSessionFilterRequest;
import com.datn.exam.model.dto.request.ExamSessionRequest;
import com.datn.exam.model.dto.request.IdsRequest;
import com.datn.exam.model.dto.response.ExamSessionResponse;
import com.datn.exam.repository.data.dto.ExamSessionDto;

import java.util.List;

public interface ExamSessionService {
    ExamSessionResponse create(ExamSessionRequest request);
    ExamSessionResponse update(Long id, ExamSessionRequest request);
    PageDTO<ExamSessionResponse> filter(ExamSessionFilterRequest request);
    void delete(IdsRequest request);
    ExamSessionResponse getById(Long id);
}
