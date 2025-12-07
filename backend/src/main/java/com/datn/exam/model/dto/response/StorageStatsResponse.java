package com.datn.exam.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorageStatsResponse {
    private Long totalSizeBytes;
    private String totalSizeFormatted;
    private Long usedSizeBytes;
    private String usedSizeFormatted;
    private Long remainingSizeBytes;
    private String remainingSizeFormatted;
    private Integer fileCount;
    private Integer folderCount;
    private List<StorageFolderInfo> folders;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StorageFolderInfo {
        private String name;
        private String path;
        private Long sizeBytes;
        private String sizeFormatted;
        private Integer fileCount;
    }
}
