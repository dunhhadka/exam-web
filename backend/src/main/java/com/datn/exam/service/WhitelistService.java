package com.datn.exam.service;

import com.datn.exam.model.dto.response.WhitelistPreviewResponse;
import org.springframework.web.multipart.MultipartFile;

public interface WhitelistService {
    WhitelistPreviewResponse previewFromExcel(Long sessionId, MultipartFile file);

    void addAvatar(Long whitelistId, MultipartFile file);

    void removeAvatar(Long whitelistId, Integer index);

    void replaceAvatar(Long whitelistId, Integer index, MultipartFile file);
}
