package com.datn.exam.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorageFileResponse {
    private String name;
    private String path;
    private String type;
    private Long sizeBytes;
    private String sizeFormatted;
    private LocalDateTime lastModified;
    private String url;
    private List<StorageFileResponse> children;
}
