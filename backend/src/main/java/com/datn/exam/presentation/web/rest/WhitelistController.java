package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.response.Response;
import com.datn.exam.model.dto.response.WhitelistPreviewResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RequestMapping("/api/whitelist")
public interface WhitelistController {
    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Response<WhitelistPreviewResponse> previewForCreate(
            @RequestParam("file") MultipartFile file
    );

    @PostMapping(value = "/preview/session/{sessionId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Response<WhitelistPreviewResponse> previewForUpdate(
            @PathVariable Long sessionId,
            @RequestParam("file") MultipartFile file
    );

    @PostMapping(value = "/{whitelistId}/avatars", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Response<Void> addAvatar(@PathVariable Long whitelistId, @RequestParam("file") MultipartFile file);

    @DeleteMapping("/{whitelistId}/avatars/{index}")
    Response<Void> removeAvatar(@PathVariable Long whitelistId, @PathVariable Integer index);

    @PutMapping(value = "/{whitelistId}/avatars/{index}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Response<Void> replaceAvatar(@PathVariable Long whitelistId, @PathVariable Integer index, @RequestParam("file") MultipartFile file);
}
