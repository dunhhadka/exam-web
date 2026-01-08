package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.ExamStudentFilterRequest;
import com.datn.exam.model.dto.response.Response;
<<<<<<< HEAD
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
=======
import com.datn.exam.model.dto.response.SessionStudentPreviewResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67

@RequestMapping("/api/session-students")
public interface SessionStudentController {

<<<<<<< HEAD
=======
    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Response<SessionStudentPreviewResponse> previewForCreate(
            @RequestParam("file") MultipartFile file);

    @PostMapping(value = "/preview/session/{sessionId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Response<SessionStudentPreviewResponse> previewForUpdate(
            @PathVariable Long sessionId,
            @RequestParam("file") MultipartFile file);

    @PostMapping(value = "/{sessionStudentId}/avatars", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Response<Void> addAvatar(
            @PathVariable Long sessionStudentId,
            @RequestParam("file") MultipartFile file);

    @DeleteMapping("/{sessionStudentId}/avatars/{index}")
    Response<Void> removeAvatar(
            @PathVariable Long sessionStudentId,
            @PathVariable Integer index);

    @PutMapping(value = "/{sessionStudentId}/avatars/{index}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Response<Void> replaceAvatar(
            @PathVariable Long sessionStudentId,
            @PathVariable Integer index,
            @RequestParam("file") MultipartFile file);

>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
    @GetMapping("/filter")
    Response<?> filterExamSessions(ExamStudentFilterRequest request);
}
