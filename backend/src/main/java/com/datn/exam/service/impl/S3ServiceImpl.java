package com.datn.exam.service.impl;

import com.datn.exam.service.S3Service;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.FileUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3ServiceImpl implements S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.s3.base-url:}")
    private String baseUrl;  // Optional: CloudFront URL

    @Value("${aws.s3.presigned-url-expiration-minutes:60}")
    private int defaultPresignedUrlExpirationMinutes;

    @Override
    public String uploadFile(InputStream inputStream, String key, String contentType, long contentLength) throws IOException {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .contentLength(contentLength)
                    // XÓA .acl(ObjectCannedACL.PUBLIC_READ) để file là private
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, contentLength));
            // Return object key instead of pre-signed URL to avoid expiration issues
            return key;
        } catch (S3Exception e) {
            log.error("Failed to upload file to S3: {}", key, e);
            throw new IOException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    @Override
    public String uploadFile(MultipartFile file, String key) throws IOException {
        if (file.isEmpty()) {
            throw new ResponseException(BadRequestError.FILE_EMPTY);
        }

        String contentType = file.getContentType();
        if (contentType == null || contentType.isEmpty()) {
            contentType = FileUtils.getContentType(file.getOriginalFilename());
        }

        return uploadFile(file.getInputStream(), key, contentType, file.getSize());
    }

    @Override
    public String uploadFromBase64(String base64Data, String key) throws IOException {
        if (base64Data == null || base64Data.isEmpty()) {
            throw new ResponseException(BadRequestError.INVALID_BASE64_DATA);
        }

        try {
            String base64String = base64Data;
            String contentType;

            if (base64Data.contains(",")) {
                String[] parts = base64Data.split(",", 2);
                String header = parts[0];
                base64String = parts[1];

                if (header.contains(":") && header.contains(";")) {
                    contentType = header.substring(header.indexOf(":") + 1, header.indexOf(";"));
                } else {
                    contentType = detectContentTypeFromBase64(base64String);
                }
            } else {
                contentType = detectContentTypeFromBase64(base64String);
            }

            byte[] imageBytes = Base64.getDecoder().decode(base64String);
            InputStream inputStream = new ByteArrayInputStream(imageBytes);
            return uploadFile(inputStream, key, contentType, imageBytes.length);
        } catch (IllegalArgumentException e) {
            log.error("Invalid Base64 data", e);
            throw new IOException("Invalid Base64 data", e);
        }
    }


    private String detectContentTypeFromBase64(String base64String) {
        String contentType = FileUtils.getContentTypeFromBase64(base64String);

        if (contentType == null || contentType.isEmpty()) {
            log.warn("Cannot detect content type from Base64, using default: image/jpeg");
            return "image/jpeg";  // Default fallback
        }

        return contentType;
    }

    @Override
    public byte[] downloadFile(String key) throws IOException {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            return s3Client.getObject(getObjectRequest).readAllBytes();
        } catch (S3Exception e) {
            throw new IOException("Failed to download file from S3: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean fileExists(String key) {
        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.headObject(headObjectRequest);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            log.error("Error checking file existence: {}", key, e);
            return false;
        }
    }

    @Override
    public boolean deleteFile(String key) {
        try {
            if (key.startsWith("http")) {
                key = extractKeyFromUrl(key);
            }

            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("Deleted file from S3: {}", key);
            return true;

        } catch (S3Exception e) {
            log.error("Failed to delete file from S3: {}", key, e);
            return false;
        }
    }

    @Override
    public String generatePresignedGetUrl(String key, int expirationMinutes) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(expirationMinutes))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);

            return presignedRequest.url().toString();

        } catch (S3Exception e) {
            log.error("Failed to generate presigned URL: {}", key, e);
            throw new RuntimeException("Failed to generate presigned URL", e);
        }
    }

    @Override
    public String extractKeyFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return url;
        }

        // Loại bỏ query parameters (cho pre-signed URLs)
        int queryIndex = url.indexOf('?');
        if (queryIndex != -1) {
            url = url.substring(0, queryIndex);
        }

        if (baseUrl != null && !baseUrl.isEmpty() && url.startsWith(baseUrl)) {
            return url.replace(baseUrl + "/", "");
        }

        String s3UrlPrefix = String.format("https://%s.s3.%s.amazonaws.com/", bucketName, region);
        if (url.startsWith(s3UrlPrefix)) {
            return url.replace(s3UrlPrefix, "");
        }

        String altS3UrlPrefix = String.format("https://s3.%s.amazonaws.com/%s/", region, bucketName);
        if (url.startsWith(altS3UrlPrefix)) {
            return url.replace(altS3UrlPrefix, "");
        }
        return url;
    }

    @Deprecated
    private String getPublicUrl(String key) {
        if (baseUrl != null && !baseUrl.isEmpty()) {
            return baseUrl + "/" + key;
        }
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }

    @Override
    public java.util.List<String> listObjects(String prefix) {
        try {
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();

            ListObjectsV2Response response = s3Client.listObjectsV2(listRequest);
            
            return response.contents().stream()
                    .map(S3Object::key)
                    .collect(java.util.stream.Collectors.toList());
        } catch (S3Exception e) {
            log.error("Failed to list objects with prefix: {}", prefix, e);
            return java.util.Collections.emptyList();
        }
    }

    @Override
    public long getObjectSize(String key) {
        try {
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            HeadObjectResponse response = s3Client.headObject(headRequest);
            return response.contentLength();
        } catch (S3Exception e) {
            log.error("Failed to get object size: {}", key, e);
            return 0;
        }
    }

    @Override
    public boolean deleteFolder(String prefix) {
        try {
            java.util.List<String> keys = listObjects(prefix);
            
            if (keys.isEmpty()) {
                return true;
            }

            for (String key : keys) {
                deleteFile(key);
            }

            log.info("Deleted folder and {} files: {}", keys.size(), prefix);
            return true;
        } catch (Exception e) {
            log.error("Failed to delete folder: {}", prefix, e);
            return false;
        }
    }

    @Override
    public java.util.Map<String, Long> getFolderSizes(String prefix) {
        java.util.Map<String, Long> folderSizes = new java.util.HashMap<>();
        
        try {
            java.util.List<String> keys = listObjects(prefix);
            
            for (String key : keys) {
                // Extract folder name from key (e.g., "whitelists/123/" from "whitelists/123/user_at_gmail_com/1")
                String relativePath = key.substring(prefix.length());
                String[] parts = relativePath.split("/");
                
                if (parts.length > 0 && !parts[0].isEmpty()) {
                    String folderName = parts[0];
                    long size = getObjectSize(key);
                    folderSizes.merge(folderName, size, Long::sum);
                }
            }
        } catch (Exception e) {
            log.error("Failed to get folder sizes for prefix: {}", prefix, e);
        }
        
        return folderSizes;
    }
}