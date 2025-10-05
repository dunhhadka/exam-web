package com.datn.exam.repository;

import com.datn.exam.model.entity.ExamSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {
    boolean existsByCode(String code);
    boolean existsByJoinToken(String token);

    @Query("SELECT es FROM ExamSession es WHERE es.deleted = FALSE AND es.id in :ids")
    List<ExamSession> findByIds(List<Long> ids);

    @Modifying
    @Query("UPDATE ExamSession es SET es.deleted = TRUE WHERE es.id IN :ids")
    int softDeleteByIds(@Param("ids") List<Long> ids);
}
