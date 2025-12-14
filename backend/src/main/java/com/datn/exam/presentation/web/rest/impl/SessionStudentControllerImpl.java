package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.ExamStudentFilterRequest;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.SessionStudentController;
import com.datn.exam.service.ExamSessionReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SessionStudentControllerImpl implements SessionStudentController {
    private final ExamSessionReadService examSessionReadService;

    @Override
    public Response<?> filterExamSessions(ExamStudentFilterRequest request) {
        return Response.of(examSessionReadService.filter(request));
    }
}
