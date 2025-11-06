package com.datn.exam.service;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.request.ExamCreateRequest;
import com.datn.exam.model.dto.request.ExamDraftRequest;
import com.datn.exam.model.dto.request.ExamFilterRequest;
import com.datn.exam.model.dto.request.ExamUpdateRequest;
import com.datn.exam.model.dto.response.ExamResponse;

import java.util.List;

public interface ExamService {
    ExamResponse createDraft(ExamDraftRequest request);
    ExamResponse createPublish(ExamCreateRequest request);
    PageDTO<ExamResponse> filter(ExamFilterRequest request);

    ExamResponse update(Long examId, ExamUpdateRequest request);
    void delete(List<Long> ids);

    Integer count(ExamFilterRequest request);
}
