package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.DraftCreateRequest;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
import com.datn.exam.model.dto.request.QuestionSearchRequest;
import com.datn.exam.model.dto.request.question.QuestionEditRequest;
import com.datn.exam.model.dto.request.question.QuestionImportRequest;
import com.datn.exam.service.question.QuestionImportService;
import com.datn.exam.model.dto.response.PagingResponse;
import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.QuestionController;
import com.datn.exam.service.QuestionService;
import com.datn.exam.service.question.QuestionEditService;
import com.datn.exam.service.question.exportfile.ExportFileService;
import com.datn.exam.service.question.importfile.MultiSheetImportResult;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
public class QuestionControllerImpl implements QuestionController {
    private final QuestionService questionService;
    private final QuestionEditService questionEditService;

    private final QuestionImportService importService;
    private final ExportFileService exportFileService;

    @Override
    public Response<QuestionResponse> createPublish(QuestionCreateRequest request) {
        return Response.of(questionService.createPublish(request));
    }

    @Override
    public Response<QuestionResponse> createDraft(DraftCreateRequest request) {
        return Response.of(questionService.createDraft(request));
    }

    @Override
    public Response<QuestionResponse> findById(long questionId) {
        return Response.of(questionService.findById(questionId));
    }

    @Override
    public Response<QuestionResponse> update() {
        return null;
    }

    @Override
    public Response<Boolean> delete(int questionId) {
        return Response.of(questionService.delete(questionId));
    }

    @Override
    public PagingResponse<QuestionResponse> search(QuestionSearchRequest request) {
        return PagingResponse.of(questionService.search(request));
    }

    @Override
    public Response<Integer> count(QuestionSearchRequest request) {
        return Response.of(questionService.count(request));
    }

    @Override
    public Response<QuestionResponse> edit(int questionId, QuestionEditRequest request) {
        return Response.of(this.questionEditService.edit(questionId, request));
    }

    @Override
    public Response<MultiSheetImportResult> importFile(QuestionImportRequest request) {
        return Response.of(importService.importFromFile(request));
    }

    @Override
    public ResponseEntity<Resource> downloadTemplateImport() throws IOException {
        return exportFileService.downloadTemplate();
    }
}
