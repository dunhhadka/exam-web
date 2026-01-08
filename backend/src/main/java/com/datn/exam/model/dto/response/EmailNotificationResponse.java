package com.datn.exam.model.dto.response;

import com.datn.exam.model.entity.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailNotificationResponse {
    private Long emailId;
    private Long attemptId;
    private String studentEmail;
    private String studentName;
    private String subject;
    private Email.Status status;
    private Integer retryCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

