package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.response.Response;
import com.datn.exam.model.dto.response.SessionStudentPreviewResponse;
import com.datn.exam.presentation.web.rest.SessionStudentController;
import com.datn.exam.service.SessionStudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class SessionStudentControllerImpl implements SessionStudentController {
    private final SessionStudentService sessionStudentService;

    @Override
    public Response<SessionStudentPreviewResponse> previewForCreate(MultipartFile file) {
        SessionStudentPreviewResponse preview = sessionStudentService.previewFromExcel(null, file);
        return Response.of(preview);
    }

    @Override
    public Response<SessionStudentPreviewResponse> previewForUpdate(Long sessionId, MultipartFile file) {
        SessionStudentPreviewResponse preview = sessionStudentService.previewFromExcel(sessionId, file);
        return Response.of(preview);
    }

    @Override
    public Response<Void> addAvatar(Long sessionStudentId, MultipartFile file) {
        sessionStudentService.addAvatar(sessionStudentId, file);
        return Response.ok();
    }

    @Override
    public Response<Void> removeAvatar(Long sessionStudentId, Integer index) {
        sessionStudentService.removeAvatar(sessionStudentId, index);
        return Response.ok();
    }

    @Override
    public Response<Void> replaceAvatar(Long sessionStudentId, Integer index, MultipartFile file) {
        sessionStudentService.replaceAvatar(sessionStudentId, index, file);
        return Response.ok();
    }
}
