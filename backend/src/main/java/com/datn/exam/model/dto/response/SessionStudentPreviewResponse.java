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
public class SessionStudentPreviewResponse {
    private Long sessionId;
    private String sessionName;
    
    // Students hợp lệ (có trong hệ thống với role STUDENT)
    private List<StudentItem> validStudents;
    
    // Students không hợp lệ (email sai format, quá nhiều avatar, v.v.)
    private List<StudentItem> invalidStudents;
    
    // Students bị trùng (đã được assign vào session này rồi)
    private List<StudentItem> duplicates;
    
    // Students không tồn tại trong hệ thống hoặc không có role STUDENT
    private List<StudentItem> missingStudents;
    
    private int totalValid;
    private int totalInvalid;
    private int totalDuplicates;
    private int totalMissing;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentItem {
        private int row;
        private String email;
        private String fullName;
        private List<String> avatarPreviews;
        private int avatarCount;
        private boolean hasAvatars;
        private String reason;
    }
}
