package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.response.Response;
import com.datn.exam.model.dto.response.SessionStudentPreviewResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RequestMapping("/api/session-students")
public interface SessionStudentController {
    

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Response<SessionStudentPreviewResponse> previewForCreate(
            @RequestParam("file") MultipartFile file
    );


    @PostMapping(value = "/preview/session/{sessionId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Response<SessionStudentPreviewResponse> previewForUpdate(
            @PathVariable Long sessionId,
            @RequestParam("file") MultipartFile file
    );


    @PostMapping(value = "/{sessionStudentId}/avatars", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Response<Void> addAvatar(
            @PathVariable Long sessionStudentId, 
            @RequestParam("file") MultipartFile file
    );


    @DeleteMapping("/{sessionStudentId}/avatars/{index}")
    Response<Void> removeAvatar(
            @PathVariable Long sessionStudentId, 
            @PathVariable Integer index
    );


    @PutMapping(value = "/{sessionStudentId}/avatars/{index}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Response<Void> replaceAvatar(
            @PathVariable Long sessionStudentId, 
            @PathVariable Integer index, 
            @RequestParam("file") MultipartFile file
    );
}
