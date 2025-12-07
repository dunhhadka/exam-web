package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.*;
import com.datn.exam.model.dto.response.ExamResponse;
import com.datn.exam.model.dto.response.PagingResponse;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.ExamController;
import com.datn.exam.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ExamControllerImpl implements ExamController {
    private final ExamService examService;

    @Override
    public Response<ExamResponse> createPublish(ExamCreateRequest request) {
        return Response.of(examService.createPublish(request));
    }

    @Override
    public Response<ExamResponse> update(Long id, ExamUpdateRequest request) {
        return Response.of(examService.update(id, request));
    }

    @Override
    public PagingResponse<ExamResponse> search(ExamFilterRequest request) {
        return PagingResponse.of(examService.filter(request));
    }

    @Override
    public Response<Integer> count(ExamFilterRequest request) {
        return Response.of(examService.count(request));
    }

    @Override
    public Response<Boolean> delete(IdsRequest request) {
        examService.delete(request.getIds());
        return Response.ok();
    }

    @Override
    public Response<ExamResponse> getById(long id) {
        return Response.of(examService.getById(id));
    }
}
