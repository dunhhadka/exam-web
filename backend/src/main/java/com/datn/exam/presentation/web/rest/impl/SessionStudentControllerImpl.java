package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.ExamStudentFilterRequest;
import com.datn.exam.model.dto.response.Response;
<<<<<<< HEAD
import com.datn.exam.presentation.web.rest.SessionStudentController;
import com.datn.exam.service.ExamSessionReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;
=======
import com.datn.exam.model.dto.response.SessionStudentPreviewResponse;
import com.datn.exam.presentation.web.rest.SessionStudentController;
import com.datn.exam.service.SessionStudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.datn.exam.service.ExamSessionReadService;
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67

@RestController
@RequiredArgsConstructor
public class SessionStudentControllerImpl implements SessionStudentController {
<<<<<<< HEAD
    private final ExamSessionReadService examSessionReadService;

    @Override
=======
    private final SessionStudentService sessionStudentService;
    private final ExamSessionReadService examSessionReadService;

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

    @Override
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
    public Response<?> filterExamSessions(ExamStudentFilterRequest request) {
        return Response.of(examSessionReadService.filter(request));
    }
}
