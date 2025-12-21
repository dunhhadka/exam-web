package com.datn.exam.service.impl;

import com.datn.exam.model.dto.request.CreateLogRequest;
import com.datn.exam.model.dto.response.LogResponse;
import com.datn.exam.model.entity.ExamAttempt;
import com.datn.exam.model.entity.Log;
import com.datn.exam.repository.ExamAttemptRepository;
import com.datn.exam.repository.LogRepository;
import com.datn.exam.service.LogService;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogServiceImpl implements LogService {
    
    private final LogRepository logRepository;
    private final ExamAttemptRepository examAttemptRepository;
    
    @Override
    @Transactional
    public LogResponse createLog(CreateLogRequest request) {
        ExamAttempt attempt = examAttemptRepository.findById(request.getAttemptId())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_ATTEMPT_NOT_FOUND));
        
        Log log = Log.builder()
                .attempt(attempt)
                .logType(request.getLogType())
                .severity(request.getSeverity() != null ? request.getSeverity() : Log.Severity.INFO)
                .message(request.getMessage())
                .evidence(request.getEvidence())
                .loggedAt(LocalDateTime.now())
                .build();
        
        log = logRepository.save(log);

        
        return LogResponse.fromEntity(log);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LogResponse> getLogsByAttemptId(Long attemptId) {
        return logRepository.findByAttemptIdOrderByLoggedAtDesc(attemptId)
                .stream()
                .map(LogResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LogResponse> getLogsBySessionId(Long sessionId) {
        return logRepository.findBySessionIdOrderByLoggedAtDesc(sessionId)
                .stream()
                .map(LogResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LogResponse> getLogsBySessionIdAndStudentEmail(Long sessionId, String studentEmail) {
        return logRepository.findBySessionIdAndStudentEmailOrderByLoggedAtDesc(sessionId, studentEmail)
                .stream()
                .map(LogResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLogsGroupedByAttempt(Long sessionId, String studentEmail) {
        List<ExamAttempt> attempts = examAttemptRepository
                .findBySessionIdAndStudentEmailOrderByStartedAtDesc(sessionId, studentEmail)
                .stream()
                .sorted(Comparator.comparing(ExamAttempt::getId))
                .toList();
        
        List<LogResponse> allLogs = logRepository
                .findBySessionIdAndStudentEmailOrderByLoggedAtDesc(sessionId, studentEmail)
                .stream()
                .map(LogResponse::fromEntity)
                .toList();
        
        Map<Long, List<LogResponse>> logsMap = allLogs.stream()
                .collect(Collectors.groupingBy(LogResponse::getAttemptId));
        
        // Tạo kết quả cho mỗi attempt
        return attempts.stream().map(attempt -> {
            Map<String, Object> attemptData = new HashMap<>();
            attemptData.put("attemptId", attempt.getId());
            attemptData.put("attemptNo", attempt.getAttemptNo());
            attemptData.put("attemptStartedAt", attempt.getStartedAt());
            attemptData.put("attemptSubmittedAt", attempt.getSubmittedAt());
            attemptData.put("status", attempt.getStatus().name());
            attemptData.put("logs", logsMap.getOrDefault(attempt.getId(), Collections.emptyList()));
            return attemptData;
        }).collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LogResponse> getLogsByAttemptIdAndSeverity(Long attemptId, List<Log.Severity> severities) {
        return logRepository.findByAttemptIdAndSeverityInOrderByLoggedAtDesc(attemptId, severities)
                .stream()
                .map(LogResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
