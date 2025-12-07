package com.datn.exam.service;

import com.datn.exam.model.dto.request.DeleteStorageRequest;
import com.datn.exam.model.dto.response.StorageFileResponse;
import com.datn.exam.model.dto.response.StorageStatsResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for managing user storage on S3
 */
public interface StorageService {
    
    /**
     * Get storage statistics for a user
     * 
     * @param userId User ID to get stats for
     * @return Storage statistics including total, used, and remaining space
     */
    StorageStatsResponse getStorageStats(UUID userId);
    
    /**
     * List files and folders in user's storage at specified path
     * 
     * @param userId User ID to list files for
     * @param path Path within user's storage (null or empty for root)
     * @return Tree structure of files and folders
     */
    List<StorageFileResponse> listFiles(UUID userId, String path);
    
    /**
     * Delete file or folder from user's storage
     * 
     * @param userId User ID performing the delete
     * @param request Delete request with path and recursive flag
     * @throws IllegalArgumentException if path is invalid or user doesn't own the resource
     */
    void deleteStorage(UUID userId, DeleteStorageRequest request);
}
