package com.datn.exam.service.impl;

import com.datn.exam.model.dto.request.DeleteStorageRequest;
import com.datn.exam.model.dto.response.StorageFileResponse;
import com.datn.exam.model.dto.response.StorageStatsResponse;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.model.entity.User;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.repository.UserRepository;
import com.datn.exam.service.S3Service;
import com.datn.exam.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StorageServiceImpl implements StorageService {

    private final S3Service s3Service;
    private final ExamSessionRepository examSessionRepository;
    private final UserRepository userRepository;
    
    private static final String WHITELIST_PREFIX = "session-students/";
    private static final long MAX_STORAGE_BYTES = 200L * 1024 * 1024; // 200 MB
    
    @Override
    public StorageStatsResponse getStorageStats(UUID userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return buildEmptyStats();
            }
            String userEmail = user.getEmail();
            
            List<ExamSession> userSessions = examSessionRepository.findAll().stream()
                    .filter(session -> userEmail.equals(session.getCreatedBy()))
                    .toList();
            
            Set<String> userSessionIds = userSessions.stream()
                    .map(session -> String.valueOf(session.getId()))
                    .collect(Collectors.toSet());
            
            String userPrefix = WHITELIST_PREFIX;
            List<String> allKeys = s3Service.listObjects(userPrefix);
            
            long totalUsedBytes = 0;
            int fileCount = 0;
            Set<String> sessionFolders = new HashSet<>();
            
            for (String key : allKeys) {
                String relativePath = key.substring(WHITELIST_PREFIX.length());
                String[] parts = relativePath.split("/");
                if (parts.length == 0 || parts[0].isEmpty()) {
                    continue;
                }
                
                String sessionId = parts[0];
                
                if (!userSessionIds.contains(sessionId)) {
                    continue;
                }
                
                sessionFolders.add(sessionId);
                
                if (!key.endsWith("/")) {
                    long size = s3Service.getObjectSize(key);
                    totalUsedBytes += size;
                    fileCount++;
                }
            }
            
            Map<String, Long> folderSizes = s3Service.getFolderSizes(userPrefix);
            List<StorageStatsResponse.StorageFolderInfo> folders = folderSizes.entrySet().stream()
                    .filter(entry -> userSessionIds.contains(entry.getKey()))
                    .map(entry -> {
                        String folderName = entry.getKey();
                        long sizeBytes = entry.getValue();
                        String sizeFormatted = formatBytes(sizeBytes);
                        
                        String folderPrefix = userPrefix + folderName + "/";
                        List<String> folderKeys = s3Service.listObjects(folderPrefix);
                        int folderFileCount = (int) folderKeys.stream()
                                .filter(k -> !k.endsWith("/"))
                                .count();
                        
                        StorageStatsResponse.StorageFolderInfo folderInfo = new StorageStatsResponse.StorageFolderInfo();
                        folderInfo.setName(folderName);
                        folderInfo.setPath(folderPrefix);
                        folderInfo.setSizeBytes(sizeBytes);
                        folderInfo.setSizeFormatted(sizeFormatted);
                        folderInfo.setFileCount(folderFileCount);
                        return folderInfo;
                    })
                    .collect(Collectors.toList());
            
            long remainingBytes = Math.max(0, MAX_STORAGE_BYTES - totalUsedBytes);
            
            return StorageStatsResponse.builder()
                    .totalSizeBytes(MAX_STORAGE_BYTES)
                    .totalSizeFormatted(formatBytes(MAX_STORAGE_BYTES))
                    .usedSizeBytes(Long.valueOf(totalUsedBytes))
                    .usedSizeFormatted(formatBytes(totalUsedBytes))
                    .remainingSizeBytes(Long.valueOf(remainingBytes))
                    .remainingSizeFormatted(formatBytes(remainingBytes))
                    .fileCount(fileCount)
                    .folderCount(sessionFolders.size())
                    .folders(folders)
                    .build();
        } catch (Exception e) {
            System.err.println("Failed to get storage stats for user: " + userId + " - " + e.getMessage());
            return buildEmptyStats();
        }
    }
    
    private StorageStatsResponse buildEmptyStats() {
        return StorageStatsResponse.builder()
                .totalSizeBytes(MAX_STORAGE_BYTES)
                .totalSizeFormatted(formatBytes(MAX_STORAGE_BYTES))
                .usedSizeBytes(0L)
                .usedSizeFormatted("0 B")
                .remainingSizeBytes(MAX_STORAGE_BYTES)
                .remainingSizeFormatted(formatBytes(MAX_STORAGE_BYTES))
                .fileCount(0)
                .folderCount(0)
                .folders(Collections.emptyList())
                .build();
    }
    
    @Override
    public List<StorageFileResponse> listFiles(UUID userId, String path) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return Collections.emptyList();
            }
            String userEmail = user.getEmail();
            
            List<ExamSession> userSessions = examSessionRepository.findAll().stream()
                    .filter(session -> userEmail.equals(session.getCreatedBy()))
                    .toList();
            
            Set<String> userSessionIds = userSessions.stream()
                    .map(session -> String.valueOf(session.getId()))
                    .collect(Collectors.toSet());
            
            String normalizedPath = normalizePath(path);
            String prefix = WHITELIST_PREFIX + normalizedPath;
            
            List<String> keys = s3Service.listObjects(prefix);
            
            Map<String, StorageFileResponse> fileMap = new HashMap<>();
            
            for (String key : keys) {
                if (key.equals(prefix) || key.equals(prefix + "/")) {
                    continue;
                }
                
                String keyRelativePath = key.substring(WHITELIST_PREFIX.length());
                String[] keyParts = keyRelativePath.split("/");
                if (keyParts.length > 0 && !userSessionIds.contains(keyParts[0])) {
                    continue; // Skip files from other users' sessions
                }
                
                String relativePath = key.substring(prefix.length());
                if (relativePath.startsWith("/")) {
                    relativePath = relativePath.substring(1);
                }
                
                String[] parts = relativePath.split("/");
                
                StringBuilder currentPath = new StringBuilder(prefix);
                StorageFileResponse parent = null;
                
                for (int i = 0; i < parts.length; i++) {
                    String part = parts[i];
                    if (part.isEmpty()) continue;
                    
                    currentPath.append(part);
                    boolean isLastPart = (i == parts.length - 1);
                    
                    if (!isLastPart) {
                        currentPath.append("/");
                    }
                    
                    String currentKey = currentPath.toString();
                    
                    if (!fileMap.containsKey(currentKey)) {
                        String type = isLastPart && !key.endsWith("/") ? "file" : "folder";
                        long sizeBytes = 0;
                        LocalDateTime lastModified = null;
                        String url = null;
                        
                        if (type.equals("file")) {
                            sizeBytes = s3Service.getObjectSize(key);
                            url = s3Service.generatePresignedGetUrl(key, 3600);
                            // We don't have lastModified from listObjects, could enhance later
                            lastModified = LocalDateTime.now();
                        }
                        
                        StorageFileResponse fileResponse = StorageFileResponse.builder()
                                .name(part)
                                .path(currentKey)
                                .type(type)
                                .sizeBytes(sizeBytes)
                                .sizeFormatted(formatBytes(sizeBytes))
                                .lastModified(lastModified)
                                .url(url)
                                .children(new ArrayList<>())
                                .build();
                        
                        fileMap.put(currentKey, fileResponse);
                        
                        if (parent != null) {
                            parent.getChildren().add(fileResponse);
                        }
                    }
                    
                    parent = fileMap.get(currentKey);
                }
            }
            
            return fileMap.values().stream()
                    .filter(f -> {
                        String parentPath = f.getPath().substring(0, f.getPath().lastIndexOf(f.getName()));
                        return parentPath.equals(prefix) || parentPath.equals(prefix + "/");
                    })
                    .collect(Collectors.toList());
            
        } catch (Exception e) {
            System.err.println("Failed to list files for user: " + userId + " at path: " + path + " - " + e.getMessage());
            return Collections.emptyList();
        }
    }
    
    @Override
    public void deleteStorage(UUID userId, DeleteStorageRequest request) {
        try {
            String path = request.getPath();
            
            if (path == null || path.trim().isEmpty() || path.equals("/")) {
                throw new IllegalArgumentException("Cannot delete root directory");
            }
            
            if (!path.startsWith(WHITELIST_PREFIX)) {
                path = WHITELIST_PREFIX + path;
            }

            if (request.isRecursive() || path.endsWith("/")) {
                boolean success = s3Service.deleteFolder(path);
                if (!success) {
                    throw new RuntimeException("Failed to delete folder: " + path);
                }
                System.out.println("User " + userId + " deleted folder: " + path);
            } else {
                s3Service.deleteFile(path);
                System.out.println("User " + userId + " deleted file: " + path);
            }
            
        } catch (Exception e) {
            System.err.println("Failed to delete storage for user: " + userId + " at path: " + request.getPath() + " - " + e.getMessage());
            throw new RuntimeException("Failed to delete storage: " + e.getMessage(), e);
        }
    }
    
    private String normalizePath(String path) {
        if (path == null || path.trim().isEmpty() || path.equals("/")) {
            return "";
        }
        
        String normalized = path.trim();
        if (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        
        return normalized.isEmpty() ? "" : normalized + "/";
    }
    
    private String formatBytes(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.2f KB", bytes / 1024.0);
        } else if (bytes < 1024 * 1024 * 1024) {
            return String.format("%.2f MB", bytes / (1024.0 * 1024));
        } else {
            return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
        }
    }
}
