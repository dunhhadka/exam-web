package com.datn.exam.repository;

import com.datn.exam.model.entity.Whitelist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface WhitelistRepository extends JpaRepository<Whitelist, Long> {
    boolean existsByExamSessionIdAndEmail(Long sessionId, String email);

    List<Whitelist> findByExamSessionId(Long sessionId);

    Optional<Whitelist> findByExamSessionIdAndEmail(Long sessionId, String email);

    @Query("SELECT w.email FROM Whitelist w WHERE w.examSession.id = :sessionId")
    List<String> findEmailsBySessionId(Long sessionId);

}
