package com.datn.exam.repository;

import com.datn.exam.model.entity.Email;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailRepository extends JpaRepository<Email, Long> {
    
    @Query("""
            SELECT e FROM Email e
            WHERE e.attemptId IN (
                SELECT a.id FROM ExamAttempt a
                WHERE a.examSession.id = :sessionId
            )
            AND e.templateName = 'mail-notification-result-template'
            ORDER BY e.createdAt DESC
            """)
    List<Email> findBySessionId(@Param("sessionId") Long sessionId);
    
    List<Email> findByAttemptId(Long attemptId);
}
