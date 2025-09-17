package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
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
    public Response<QuestionResponse> create(QuestionCreateRequest request) {
        return Response.of(questionService.createQuestion(request));
    }

    @Override
    public Response<QuestionResponse> update() {
        return null;
    }

    @Override
    public boolean delete() {
        return false;
    }

    @Override
    public PageDTO<QuestionResponse> search() {
        return null;
    }
}
