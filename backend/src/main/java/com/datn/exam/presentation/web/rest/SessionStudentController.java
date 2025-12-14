package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.ExamStudentFilterRequest;
import com.datn.exam.model.dto.response.Response;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api/session-students")
public interface SessionStudentController {

    @GetMapping("/filter")
    Response<?> filterExamSessions(ExamStudentFilterRequest request);
}
