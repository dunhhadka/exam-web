package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.CreateLogRequest;
import com.datn.exam.model.dto.response.LogResponse;
import com.datn.exam.model.dto.response.Response;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequestMapping("/api/logs")
public interface LogController {
    
    @PostMapping
    Response<LogResponse> createLog(@Valid @RequestBody CreateLogRequest request);
    
    @GetMapping("/attempt/{attemptId}")
    Response<List<LogResponse>> getLogsByAttemptId(@PathVariable Long attemptId);
    
    @GetMapping("/session/{sessionId}")
    Response<List<LogResponse>> getLogsBySessionId(@PathVariable Long sessionId);
    
    @GetMapping("/session/{sessionId}/student/{email}")
    Response<List<LogResponse>> getLogsBySessionIdAndStudentEmail(
            @PathVariable Long sessionId,
            @PathVariable String email
    );
    
    @GetMapping("/session/{sessionId}/student/{email}/grouped")
    Response<List<Map<String, Object>>> getLogsGroupedByAttempt(
            @PathVariable Long sessionId,
            @PathVariable String email
    );
}

