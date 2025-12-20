package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.request.CreateLogRequest;
import com.datn.exam.model.dto.response.LogResponse;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.LogController;
import com.datn.exam.service.LogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class LogControllerImpl implements LogController {
    
    private final LogService logService;
    
    @Override
    public Response<LogResponse> createLog(CreateLogRequest request) {
        log.info("Creating log: attemptId={}, type={}, severity={}", 
                request.getAttemptId(), request.getLogType(), request.getSeverity());
        
        LogResponse createdLog = logService.createLog(request);
        return Response.of(createdLog);
    }
    
    @Override
    public Response<List<LogResponse>> getLogsByAttemptId(Long attemptId) {
        log.info("Getting logs for attempt: {}", attemptId);
        List<LogResponse> logs = logService.getLogsByAttemptId(attemptId);
        return Response.of(logs);
    }
    
    @Override
    public Response<List<LogResponse>> getLogsBySessionId(Long sessionId) {
        log.info("Getting logs for session: {}", sessionId);
        List<LogResponse> logs = logService.getLogsBySessionId(sessionId);
        return Response.of(logs);
    }
    
    @Override
    public Response<List<LogResponse>> getLogsBySessionIdAndStudentEmail(Long sessionId, String email) {
        log.info("Getting logs for session: {} and student: {}", sessionId, email);
        List<LogResponse> logs = logService.getLogsBySessionIdAndStudentEmail(sessionId, email);
        return Response.of(logs);
    }
    
    @Override
    public Response<List<Map<String, Object>>> getLogsGroupedByAttempt(Long sessionId, String email) {
        log.info("Getting logs grouped by attempt for session: {} and student: {}", sessionId, email);
        List<Map<String, Object>> groupedLogs = logService.getLogsGroupedByAttempt(sessionId, email);
        return Response.of(groupedLogs);
    }
}

