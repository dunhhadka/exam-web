package com.datn.exam.repository;

import com.datn.exam.model.entity.ExamAttemptQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamAttemptQuestionRepository extends JpaRepository<ExamAttemptQuestion, Long> {
    List<ExamAttemptQuestion> findByAttemptIdOrderByOrderIndex(Long attemptId);
}
