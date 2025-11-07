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
    Response<QuestionResponse> createPublish(@RequestBody @Valid QuestionCreateRequest request);

    @PostMapping("/draft")
    @ResponseStatus(HttpStatus.CREATED)
    Response<QuestionResponse> createDraft(@RequestBody @Valid DraftCreateRequest request);

    @GetMapping("/{questionId}")
    Response<QuestionResponse> findById(@PathVariable long questionId);

    Response<QuestionResponse> update();

    @DeleteMapping("/{questionId}")
    boolean delete(@PathVariable int questionId);

    @GetMapping("/filter")
    @ResponseStatus(HttpStatus.OK)
    PagingResponse<QuestionResponse> search(@Valid QuestionSearchRequest request);

    @GetMapping("/filter/count")
    Response<Integer> count(QuestionSearchRequest request);
}
