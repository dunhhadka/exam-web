package com.datn.exam.service;

public interface MailPersistenceService {

    void createMail(String email,
                    String subject,
                    String otp,
                    String templateName,
                    Integer expiresMinutes,
                    Integer durationMinutes,
                    Integer lateJoinMinutes);
}
