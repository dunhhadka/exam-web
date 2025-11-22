package com.datn.exam.repository;

import com.datn.exam.model.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    @Query("SELECT e FROM Exam e WHERE e.createdBy = :createdBy AND (e.deleted IS NULL OR e.deleted = FALSE)")
    List<Exam> findByCreatedByAndNotDeleted(@Param("createdBy") String createdBy);
}
