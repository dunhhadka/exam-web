package com.datn.exam.model.dto.request;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
public class DeleteStorageRequest {
    @NotBlank(message = "Path is required")
    private String path;
    
    private boolean recursive = false;
}
