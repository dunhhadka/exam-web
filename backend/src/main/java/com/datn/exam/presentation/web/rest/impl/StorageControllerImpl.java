package com.datn.exam.presentation.web.rest.impl;


import com.datn.exam.model.dto.request.DeleteStorageRequest;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.model.dto.response.StorageFileResponse;
import com.datn.exam.model.dto.response.StorageStatsResponse;
import com.datn.exam.service.StorageService;
import com.datn.exam.support.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
@Slf4j
public class StorageControllerImpl {

    private final StorageService storageService;

    @GetMapping("/stats")
    public Response<StorageStatsResponse> getStorageStats(Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        StorageStatsResponse stats = storageService.getStorageStats(userId);
        return Response.of(stats);
    }

    @GetMapping("/files")
    public Response<List<StorageFileResponse>> listFiles(
            @RequestParam(required = false) String path,
            Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<StorageFileResponse> files = storageService.listFiles(userId, path);
        return Response.of(files);
    }


    @DeleteMapping
    public Response<Void> deleteStorage(
            @Valid @RequestBody DeleteStorageRequest request,
            Authentication authentication) {
        UUID userId = SecurityUtils.getCurrentUserId();
        storageService.deleteStorage(userId, request);
        return Response.ok();
    }
}