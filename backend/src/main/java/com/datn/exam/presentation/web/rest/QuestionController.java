package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.DraftCreateRequest;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
import com.datn.exam.model.dto.request.QuestionSearchRequest;
import com.datn.exam.model.dto.response.PagingResponse;
import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.dto.response.Response;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api/question")
public interface QuestionController {
    @PostMapping("/publish")
    @ResponseStatus(HttpStatus.CREATED)
    public Response<QuestionResponse> createPublish(@RequestBody @Valid QuestionCreateRequest request);

    @PostMapping("/draft")
    @ResponseStatus(HttpStatus.CREATED)
    public Response<QuestionResponse> createDraft(@RequestBody @Valid DraftCreateRequest request);


    public Response<QuestionResponse> update();

    public boolean delete();

    @GetMapping("/filter")
    @ResponseStatus(HttpStatus.OK)
    public PagingResponse<QuestionResponse> search(@Valid QuestionSearchRequest request);
}
