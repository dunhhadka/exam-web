package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.DraftCreateRequest;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
import com.datn.exam.model.dto.request.QuestionSearchRequest;
import com.datn.exam.model.dto.response.PagingResponse;
import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.QuestionController;
import com.datn.exam.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class QuestionControllerImpl implements QuestionController {
    private final QuestionService questionService;

    @Override
    public Response<QuestionResponse> createPublish(QuestionCreateRequest request) {
        return Response.of(questionService.createPublish(request));
    }

    @Override
    public Response<QuestionResponse> createDraft(DraftCreateRequest request) {
        return Response.of(questionService.createDraft(request));
    }

    @Override
    public Response<QuestionResponse> findById(long questionId) {
        return Response.of(questionService.findById(questionId));
    }

    @Override
    public Response<QuestionResponse> update() {
        return null;
    }

    @Override
    public Response<Boolean> delete(int questionId) {
        return Response.of(questionService.delete(questionId));
    }

    @Override
    public PagingResponse<QuestionResponse> search(QuestionSearchRequest request) {
        return PagingResponse.of(questionService.search(request));
    }

    @Override
    public Response<Integer> count(QuestionSearchRequest request) {
        return Response.of(questionService.count(request));
    }
}
