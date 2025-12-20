package com.datn.exam.service;

import com.datn.exam.model.dto.request.CreateLogRequest;
import com.datn.exam.model.dto.response.LogResponse;
import com.datn.exam.model.entity.Log;

import java.util.List;
import java.util.Map;

public interface LogService {
    LogResponse createLog(CreateLogRequest request);
    
    List<LogResponse> getLogsByAttemptId(Long attemptId);
    
    List<LogResponse> getLogsBySessionId(Long sessionId);
    
    List<LogResponse> getLogsBySessionIdAndStudentEmail(Long sessionId, String studentEmail);
    
    List<Map<String, Object>> getLogsGroupedByAttempt(Long sessionId, String studentEmail);
    
    List<LogResponse> getLogsByAttemptIdAndSeverity(Long attemptId, List<Log.Severity> severities);
}
