package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.dto.response.Response;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;

@RequestMapping("/api/question")
public interface QuestionController {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Response<QuestionResponse> create(@RequestBody @Valid QuestionCreateRequest request);

    public Response<QuestionResponse> update();

    public boolean delete();

    public PageDTO<QuestionResponse> search();
}
