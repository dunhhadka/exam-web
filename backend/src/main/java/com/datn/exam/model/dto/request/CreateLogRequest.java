package com.datn.exam.model.dto.request;

import com.datn.exam.model.entity.Log;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLogRequest {
    
    @NotNull(message = "Attempt ID is required")
    private Long attemptId;
    
    @NotNull(message = "Log type is required")
    private Log.LogType logType;
    
    private Log.Severity severity;
    
    @Size(max = 500, message = "Message must not exceed 500 characters")
    private String message;
    
    @Size(max = 255, message = "Evidence must not exceed 255 characters")
    private String evidence;
}
