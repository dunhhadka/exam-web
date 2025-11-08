package com.datn.exam.service;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.request.DraftCreateRequest;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
import com.datn.exam.model.dto.request.QuestionSearchRequest;
import com.datn.exam.model.dto.request.QuestionUpdateRequest;
import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.dto.response.Response;

public interface QuestionService {
    QuestionResponse createPublish(QuestionCreateRequest request);
    QuestionResponse createDraft(DraftCreateRequest request);
    QuestionResponse update(QuestionUpdateRequest request);
    boolean delete(long id);
    PageDTO<QuestionResponse> search(QuestionSearchRequest request);

    Integer count(QuestionSearchRequest request);

    QuestionResponse findById(long questionId);
}
