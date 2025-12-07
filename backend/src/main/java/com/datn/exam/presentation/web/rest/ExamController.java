package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.*;
import com.datn.exam.model.dto.response.ExamResponse;
import com.datn.exam.model.dto.response.PagingResponse;
import com.datn.exam.model.dto.response.Response;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api/exam")
public interface ExamController {
    @PostMapping("/publish")
    @ResponseStatus(HttpStatus.CREATED)
    Response<ExamResponse> createPublish(@RequestBody @Valid ExamCreateRequest request);

//    @PostMapping("/draft")
//    @ResponseStatus(HttpStatus.CREATED)
//    public Response<QuestionResponse> createDraft(@RequestBody @Valid DraftCreateRequest request);

    @PutMapping("/update/{id}")
    @ResponseStatus(HttpStatus.OK)
    Response<ExamResponse> update(@PathVariable(name = "id") Long id, @RequestBody @Valid ExamUpdateRequest request);

    @GetMapping("/filter")
    @ResponseStatus(HttpStatus.OK)
    PagingResponse<ExamResponse> search(@Valid ExamFilterRequest request);

    @GetMapping("/filter/count")
    Response<Integer> count(ExamFilterRequest request);

    @DeleteMapping("/delete")
    Response<Boolean> delete(@RequestBody IdsRequest request);

    @GetMapping("/{id}")
    Response<ExamResponse> getById(@PathVariable long id);
}
