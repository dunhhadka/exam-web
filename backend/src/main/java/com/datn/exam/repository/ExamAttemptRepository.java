package com.datn.exam.repository;

import com.datn.exam.model.entity.ExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Long> {
    @Query("SELECT COUNT(ea) FROM ExamAttempt ea WHERE ea.examSession.id = :sessionId AND ea.studentEmail = :email")
    int countByExamSessionIdAndStudentEmail(Long sessionId, String email);

    @Query("SELECT COALESCE(MAX(ea.attemptNo), 0) FROM ExamAttempt ea WHERE ea.examSession.id = :sessionId AND ea.studentEmail = :email")
    int findMaxAttemptNoByEmail(Long sessionId, String email);

    Optional<ExamAttempt> findByIdAndStudentEmail(Long id, String email);

    @Query("""
            SELECT a FROM ExamAttempt a
                   LEFT JOIN FETCH a.attemptQuestions aq
                   WHERE a.examSession.id = :sessionId
                     AND a.studentEmail = :email
                     AND a.status = :status
            """)
    Optional<ExamAttempt> findByExamSessionIdAndStudentEmailAndStatus(Long sessionId, String email, ExamAttempt.AttemptStatus status);

}
