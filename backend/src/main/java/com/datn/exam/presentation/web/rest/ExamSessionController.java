package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.*;
import com.datn.exam.model.dto.response.*;
import com.datn.exam.repository.data.dto.ExamSessionDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api/exam-session")
public interface ExamSessionController {

    @PostMapping("")
    @ResponseStatus(HttpStatus.CREATED)
    Response<ExamSessionResponse> create(@RequestBody @Valid ExamSessionRequest request);

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    Response<ExamSessionResponse> update(@PathVariable(name = "id") Long id, @RequestBody @Valid ExamSessionRequest request);

    @GetMapping("/filter")
    @ResponseStatus(HttpStatus.OK)
    PagingResponse<ExamSessionResponse> search(@Valid ExamSessionFilterRequest request);

    @DeleteMapping("/delete")
    @ResponseStatus(HttpStatus.OK)
    Response<Boolean> delete(@RequestBody IdsRequest request);

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    Response<ExamSessionResponse> getById(@PathVariable(name = "id") Long id);

    @GetMapping("/filter/count")
    Response<Integer> count(ExamSessionFilterRequest request);

//    @GetMapping("/{id}/qr")
//    @ResponseStatus(HttpStatus.OK)
//    Response<ExamSessionMetaResponse> join(@RequestBody)
}
