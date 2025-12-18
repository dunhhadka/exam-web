package com.datn.exam.model.dto.response;

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
public class SessionStudentResponse {
    
    private UUID userId;
    
    private String email;
    
    private String name;
    
    private List<String> avatarUrls;
}
