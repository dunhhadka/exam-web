package com.datn.exam.repository;

import com.datn.exam.model.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Long> {

    @Query("SELECT eq FROM ExamQuestion eq JOIN FETCH eq.question q LEFT JOIN FETCH q.answers WHERE eq.exam.id = :examId ORDER BY eq.orderIndex")
    List<ExamQuestion> findByExamIdWithQuestionAndAnswers(Long examId);
}
