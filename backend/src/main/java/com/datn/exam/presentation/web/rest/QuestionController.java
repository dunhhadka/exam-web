package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.DraftCreateRequest;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
import com.datn.exam.model.dto.request.QuestionSearchRequest;
import com.datn.exam.model.dto.request.question.QuestionEditRequest;
import com.datn.exam.model.dto.request.question.QuestionImportRequest;
import com.datn.exam.model.dto.response.PagingResponse;
import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.service.question.importfile.MultiSheetImportResult;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

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
    Response<Boolean> delete(@PathVariable int questionId);

    @GetMapping("/filter")
    @ResponseStatus(HttpStatus.OK)
    PagingResponse<QuestionResponse> search(@Valid QuestionSearchRequest request);

    @GetMapping("/filter/count")
    Response<Integer> count(QuestionSearchRequest request);

    @PutMapping("/{questionId}")
    Response<QuestionResponse> edit(@PathVariable int questionId, @RequestBody QuestionEditRequest request);

    @PostMapping("/import")
    Response<MultiSheetImportResult> importFile(@RequestBody QuestionImportRequest request);

    @GetMapping("/template/download")
    ResponseEntity<Resource> downloadTemplateImport() throws IOException;
}
