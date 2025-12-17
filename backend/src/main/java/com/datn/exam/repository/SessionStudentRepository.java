package com.datn.exam.repository;

import com.datn.exam.model.entity.SessionStudent;
import com.datn.exam.repository.projection.SessionUserProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionStudentRepository extends JpaRepository<SessionStudent, Long> {

    List<SessionStudent> findByExamSessionId(Long examSessionId);

    boolean existsByExamSessionIdAndUserId(Long examSessionId, UUID userId);

    @Query("SELECT COUNT(ss) > 0 FROM SessionStudent ss WHERE ss.examSession.id = :sessionId AND ss.user.email = :email")
    boolean existsByExamSessionIdAndUserEmail(@Param("sessionId") Long sessionId, @Param("email") String email);

    Optional<SessionStudent> findByExamSessionIdAndUserId(Long sessionId, UUID userId);

    @Query("SELECT ss FROM SessionStudent ss WHERE ss.examSession.id = :sessionId AND ss.user.email IN :emails")
    List<SessionStudent> findBySessionIdAndEmails(@Param("sessionId") Long sessionId,
            @Param("emails") List<String> emails);

    List<SessionStudent> findByUserId(UUID userId);

    void deleteByExamSessionId(Long sessionId);

    @Query("SELECT ss.user.id FROM SessionStudent ss WHERE ss.examSession.id = :sessionId")
    List<UUID> findUserIdsBySessionId(@Param("sessionId") Long sessionId);

    @Query(value = """
                SELECT
                    ss.exam_session_id as examSessionId,
                    ss.user_id as userId
                FROM session_students ss
                WHERE ss.exam_session_id IN (:sessionIds)
            """, nativeQuery = true)
    List<SessionUserProjection> findUserIdsBySessionIds(@Param("sessionIds") List<Long> sessionIds);
}
