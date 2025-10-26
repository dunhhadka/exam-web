package com.datn.exam.repository;

import com.datn.exam.model.entity.ExamSessionAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExamSessionAccessRepository extends JpaRepository<ExamSessionAccess, Long> {
    boolean existsByExamSessionIdAndEmail(Long sessionId, String email);
}
