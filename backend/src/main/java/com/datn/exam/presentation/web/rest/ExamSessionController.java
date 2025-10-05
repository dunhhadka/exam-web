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
    public Response<ExamSessionResponse> create(@RequestBody @Valid ExamSessionRequest request);

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public Response<ExamSessionResponse> update(@PathVariable(name = "id") Long id, @RequestBody @Valid ExamSessionRequest request);

    @GetMapping("/filter")
    @ResponseStatus(HttpStatus.OK)
    public PagingResponse<ExamSessionDto> search(@Valid ExamSessionFilterRequest request);

    @DeleteMapping("/delete")
    @ResponseStatus(HttpStatus.OK)
    Response<Boolean> delete(@RequestBody IdsRequest request);

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    Response<ExamSessionResponse> getById(@PathVariable(name = "id") Long id);

//    @GetMapping("/{id}/qr")
//    @ResponseStatus(HttpStatus.OK)
//    Response<ExamSessionMetaResponse> join(@RequestBody)
}
