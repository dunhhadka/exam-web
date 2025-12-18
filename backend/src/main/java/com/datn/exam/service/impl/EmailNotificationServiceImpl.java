package com.datn.exam.service.impl;

import com.datn.exam.model.dto.response.EmailNotificationResponse;
import com.datn.exam.model.entity.Email;
import com.datn.exam.model.entity.ExamAttempt;
import com.datn.exam.repository.EmailRepository;
import com.datn.exam.repository.ExamAttemptRepository;
import com.datn.exam.service.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmailNotificationServiceImpl implements EmailNotificationService {
    private final EmailRepository emailRepository;
    private final ExamAttemptRepository examAttemptRepository;

    @Override
    @Transactional(readOnly = true)
    public List<EmailNotificationResponse> getEmailNotificationsBySession(Long sessionId) {
        List<Email> emails = emailRepository.findBySessionId(sessionId);
        
        if (emails.isEmpty()) {
            return List.of();
        }

        List<Long> attemptIds = emails.stream()
                .map(Email::getAttemptId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, ExamAttempt> attemptMap = attemptIds.isEmpty() 
                ? Map.of()
                : examAttemptRepository.findAllById(attemptIds).stream()
                        .collect(Collectors.toMap(ExamAttempt::getId, a -> a));

        return emails.stream()
                .map((Email email) -> {
                    ExamAttempt attempt = email.getAttemptId() != null 
                            ? attemptMap.get(email.getAttemptId()) 
                            : null;
                    
                    return EmailNotificationResponse.builder()
                            .emailId(email.getId())
                            .attemptId(email.getAttemptId())
                            .studentEmail(email.getTo())
                            .studentName(attempt != null ? attempt.getStudentName() : null)
                            .subject(email.getSubject())
                            .status(email.getStatus())
                            .retryCount(email.getRetryCount())
                            .createdAt(email.getCreatedAt())
                            .updatedAt(email.getLastModifiedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }
}

