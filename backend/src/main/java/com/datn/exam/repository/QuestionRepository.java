package com.datn.exam.repository;

import com.datn.exam.model.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @Query("SELECT q FROM Question q WHERE q.text LIKE :%text%")
    List<Question> findByText(String text);
}
