package com.datn.exam.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrivateAccessConfig {
    
    private PrivateAccessMode mode;
    
    // Option 1: Manual select - Teacher chọn từ danh sách có sẵn
    private List<UUID> studentIds;
    
    // Option 2: Import Excel - Import với emails + avatars
    private List<StudentImportEntry> importEntries;
    
    public enum PrivateAccessMode {
        MANUAL_SELECT,  // Chọn thủ công từ dropdown
        IMPORT_EXCEL    // Import file Excel
    }
}
