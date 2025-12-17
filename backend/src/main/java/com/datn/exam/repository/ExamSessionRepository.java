package com.datn.exam.repository;

import com.datn.exam.model.entity.ExamSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {
    boolean existsByCode(String code);
    boolean existsByJoinToken(String token);

    @Query("SELECT es FROM ExamSession es WHERE es.deleted = FALSE AND es.id in :ids")
    List<ExamSession> findByIds(List<Long> ids);

    @Modifying
    @Query("UPDATE ExamSession es SET es.deleted = TRUE WHERE es.id IN :ids")
    void softDeleteByIds(@Param("ids") List<Long> ids);

    Optional<ExamSession> findByCode(String code);

    Optional<ExamSession> findByJoinToken(String joinToken);

    @Query("""
            SELECT DISTINCT es FROM ExamSession es
            LEFT JOIN FETCH es.exam e
            WHERE es.exam.id IN :examIds
            AND (es.deleted IS NULL OR es.deleted = FALSE)
            """)
    List<ExamSession> findByExamIdsWithExam(@Param("examIds") Collection<Long> examIds);

    @Query("""
                SELECT es
                FROM ExamSession es
                WHERE es.deleted IS NULL OR es.deleted = FALSE
                AND es.startTime <= :reminder
            """)
    List<ExamSession> findUpComingReminder(LocalDateTime reminder);
}
