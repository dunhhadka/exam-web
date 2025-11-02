package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.ExamSessionFilterRequest;
import com.datn.exam.model.dto.request.ExamSessionRequest;
import com.datn.exam.model.dto.request.IdsRequest;
import com.datn.exam.model.dto.response.ExamResponse;
import com.datn.exam.model.dto.response.ExamSessionResponse;
import com.datn.exam.model.dto.response.PagingResponse;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.ExamSessionController;
import com.datn.exam.repository.data.dto.ExamSessionDto;
import com.datn.exam.service.ExamSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ExamSessionControllerImpl implements ExamSessionController {
    private final ExamSessionService examSessionService;

    @Override
    public Response<ExamSessionResponse> create(ExamSessionRequest request) {
        return Response.of(examSessionService.create(request));
    }

    @Override
    public Response<ExamSessionResponse> update(Long id, ExamSessionRequest request) {
        return Response.of(examSessionService.update(id, request));
    }

    @Override
    public PagingResponse<ExamSessionResponse> search(ExamSessionFilterRequest request) {
        return PagingResponse.of(examSessionService.filter(request));
    }

    @Override
    public Response<Boolean> delete(IdsRequest request) {
        return null;
    }

    @Override
    public Response<ExamSessionResponse> getById(Long id) {
        return Response.of(examSessionService.getById(id));
    }
}
