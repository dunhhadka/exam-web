package com.datn.exam.service;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.request.DraftCreateRequest;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
import com.datn.exam.model.dto.request.QuestionSearchRequest;
import com.datn.exam.model.dto.request.QuestionUpdateRequest;
import com.datn.exam.model.dto.response.QuestionResponse;

public interface QuestionService {
    QuestionResponse createPublish(QuestionCreateRequest request);
    QuestionResponse createDraft(DraftCreateRequest request);
    QuestionResponse update(QuestionUpdateRequest request);
    void delete(long id);
    PageDTO<QuestionResponse> search(QuestionSearchRequest request);
}
