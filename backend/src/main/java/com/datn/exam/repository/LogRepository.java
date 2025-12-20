package com.datn.exam.repository;

import com.datn.exam.model.entity.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LogRepository extends JpaRepository<Log, Long> {
    
    @Query("SELECT l FROM Log l WHERE l.attempt.id = :attemptId ORDER BY l.loggedAt DESC")
    List<Log> findByAttemptIdOrderByLoggedAtDesc(@Param("attemptId") Long attemptId);
    
    @Query("SELECT l FROM Log l WHERE l.attempt.id = :attemptId AND l.severity IN :severities ORDER BY l.loggedAt DESC")
    List<Log> findByAttemptIdAndSeverityInOrderByLoggedAtDesc(
            @Param("attemptId") Long attemptId, 
            @Param("severities") List<Log.Severity> severities
    );
    
    @Query("SELECT l FROM Log l WHERE l.attempt.examSession.id = :sessionId ORDER BY l.loggedAt DESC")
    List<Log> findBySessionIdOrderByLoggedAtDesc(@Param("sessionId") Long sessionId);
    
    @Query("SELECT l FROM Log l WHERE l.attempt.examSession.id = :sessionId AND l.attempt.studentEmail = :studentEmail ORDER BY l.loggedAt DESC")
    List<Log> findBySessionIdAndStudentEmailOrderByLoggedAtDesc(
            @Param("sessionId") Long sessionId,
            @Param("studentEmail") String studentEmail
    );
}
