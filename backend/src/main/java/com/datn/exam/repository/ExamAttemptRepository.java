package com.datn.exam.repository;

import com.datn.exam.model.entity.ExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Long> {
    @Query("SELECT COUNT(ea) FROM ExamAttempt ea WHERE ea.examSession.id = :sessionId AND ea.studentEmail = :email")
    int countByExamSessionIdAndStudentEmail(Long sessionId, String email);

    @Query("SELECT COUNT(ea) FROM ExamAttempt ea WHERE ea.examSession.id = :sessionId AND ea.studentEmail = :email AND ea.status IN ('SUBMITTED', 'ABANDONED')")
    int countCompletedAttempts(Long sessionId, String email);

    @Query(value = "SELECT COALESCE(MAX(ea.attempt_no), 0) FROM exam_attempts ea WHERE ea.exam_session_id = :sessionId AND ea.student_email = :email FOR UPDATE", nativeQuery = true)
    int findMaxAttemptNoByEmail(@Param("sessionId") Long sessionId, @Param("email") String email);
    
    @Query("SELECT ea FROM ExamAttempt ea WHERE ea.examSession.id = :sessionId AND ea.studentEmail = :email ORDER BY ea.startedAt DESC")
    List<ExamAttempt> findBySessionIdAndStudentEmailOrderByStartedAtDesc(@Param("sessionId") Long sessionId, @Param("email") String email);

    Optional<ExamAttempt> findByIdAndStudentEmail(Long id, String email);

    @Query("""
            SELECT a FROM ExamAttempt a
                   LEFT JOIN FETCH a.attemptQuestions aq
                   WHERE a.examSession.id = :sessionId
                     AND a.studentEmail = :email
                     AND a.status = :status
            """)
    List<ExamAttempt> findByExamSessionIdAndStudentEmailAndStatus(Long sessionId, String email, ExamAttempt.AttemptStatus status);

    @Query("""
            SELECT a FROM ExamAttempt a
                   LEFT JOIN FETCH a.attemptQuestions aq
                   LEFT JOIN FETCH aq.answer
                   WHERE a.examSession.id = :sessionId
                   ORDER BY a.submittedAt DESC, a.createdAt DESC
            """)
    List<ExamAttempt> findByExamSessionIdOrderBySubmittedAtDesc(Long sessionId);

    @Query("SELECT a FROM ExamAttempt a WHERE a.examSession.id = :sessionId")
    List<ExamAttempt> findByExamSessionId(Long sessionId);

    @Query("""
            SELECT DISTINCT a FROM ExamAttempt a
            LEFT JOIN FETCH a.examSession es
            LEFT JOIN FETCH es.exam e
            WHERE es.id IN :sessionIds
            """)
    List<ExamAttempt> findBySessionIdsWithRelations(@Param("sessionIds") Collection<Long> sessionIds);

    @Query("""
            SELECT a FROM ExamAttempt a
            LEFT JOIN FETCH a.examSession es
            WHERE a.status = :status
            """)
    List<ExamAttempt> findByStatus(@Param("status") ExamAttempt.AttemptStatus status);

    @Query("""
            SELECT a FROM ExamAttempt a
            LEFT JOIN FETCH a.examSession es
            LEFT JOIN FETCH es.exam e
            WHERE a.examSession.id = :sessionId
              AND a.gradingStatus = :gradingStatus
            """)
    List<ExamAttempt> findByExamSessionIdAndGradingStatus(
            @Param("sessionId") Long sessionId,
            @Param("gradingStatus") ExamAttempt.GradingStatus gradingStatus
    );

}
