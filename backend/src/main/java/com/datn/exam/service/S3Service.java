package com.datn.exam.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

public interface S3Service {
    String uploadFile(InputStream inputStream, String key, String contentType, long contentLength) throws IOException;

    String uploadFile(MultipartFile file, String key) throws IOException;

    String uploadFromBase64(String base64Data, String key) throws IOException;

    byte[] downloadFile(String key) throws IOException;

    boolean fileExists(String key);

    boolean deleteFile(String key);

    String generatePresignedGetUrl(String key, int expirationMinutes);

    String extractKeyFromUrl(String url);

    // Storage management methods
    java.util.List<String> listObjects(String prefix);

    long getObjectSize(String key);

    boolean deleteFolder(String prefix);

    java.util.Map<String, Long> getFolderSizes(String prefix);
}
