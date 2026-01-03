package com.datn.exam.service;

import java.math.BigDecimal;
import java.util.List;

public interface MailPersistenceService {

    void createMail(String email,
                    String subject,
                    String otp,
                    String templateName,
                    Integer expiresMinutes,
                    Integer durationMinutes,
                    Integer lateJoinMinutes);
    
    void createResultMail(String email,
                         String subject,
                         String templateName,
                         String studentName,
                         String examName,
                         String sessionCode,
                         String duration,
                         String submittedDate,
                         java.math.BigDecimal score,
                         java.math.BigDecimal maxScore,
                         Integer totalQuestions,
                         Integer correctAnswers,
                         Integer incorrectAnswers,
                         Integer accuracy,
                         Boolean hasCheatingLogs,
                         java.util.List<String> cheatingLogs,
                         Long attemptId);
    void createOrUpdateResultMail(String email,
                                  String subject,
                                  String templateName,
                                  String studentName,
                                  String examName,
                                  String sessionCode,
                                  String duration,
                                  String submittedDate,
                                  BigDecimal score,
                                  BigDecimal maxScore,
                                  Integer totalQuestions,
                                  Integer correctAnswers,
                                  Integer incorrectAnswers,
                                  Integer accuracy,
                                  Boolean hasCheatingLogs,
                                  List<String> cheatingLogs,
                                  Long attemptId);}
