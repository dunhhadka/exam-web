package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.response.Response;
import com.datn.exam.model.dto.response.WhitelistPreviewResponse;
import com.datn.exam.presentation.web.rest.WhitelistController;
import com.datn.exam.service.WhitelistService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class WhitelistControllerImpl implements WhitelistController {
    private final WhitelistService whitelistService;

    @Override
    public Response<WhitelistPreviewResponse> previewForCreate(MultipartFile file) {
        WhitelistPreviewResponse preview = whitelistService.previewFromExcel(null, file);
        return Response.of(preview);
    }

    @Override
    public Response<WhitelistPreviewResponse> previewForUpdate(Long sessionId, MultipartFile file) {
        WhitelistPreviewResponse preview = whitelistService.previewFromExcel(sessionId, file);
        return Response.of(preview);
    }

    @Override
    public Response<Void> addAvatar(Long whitelistId, MultipartFile file) {
        whitelistService.addAvatar(whitelistId, file);
        return Response.ok();
    }

    @Override
    public Response<Void> removeAvatar(Long whitelistId, Integer index) {
        whitelistService.removeAvatar(whitelistId, index);
        return Response.ok();
    }

    @Override
    public Response<Void> replaceAvatar(Long whitelistId, Integer index, MultipartFile file) {
        whitelistService.replaceAvatar(whitelistId, index, file);
        return Response.ok();
    }
}
