package com.datn.exam.service;

import com.datn.exam.model.dto.response.SessionStudentPreviewResponse;
import org.springframework.web.multipart.MultipartFile;

public interface SessionStudentService {
    SessionStudentPreviewResponse previewFromExcel(Long sessionId, MultipartFile file);

    void addAvatar(Long sessionStudentId, MultipartFile file);

    void removeAvatar(Long sessionStudentId, Integer index);

    void replaceAvatar(Long sessionStudentId, Integer index, MultipartFile file);
}
