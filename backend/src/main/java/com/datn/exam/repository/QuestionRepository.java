package com.datn.exam.repository;

import com.datn.exam.model.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    @Query("SELECT q FROM Question q WHERE q.text LIKE CONCAT('%', :text, '%')")
    List<Question> findByText(@Param("text") String text);

    @Query("SELECT q FROM Question q WHERE q.id IN (:ids)")
    List<Question> findByIds(List<Long> ids);
}
