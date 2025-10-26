package com.datn.exam.model.entity;

import com.datn.exam.support.converter.MapObjectConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "exam_attempt_answers")
@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExamAttemptAnswer extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "attempt_question_id", nullable = false)
    private ExamAttemptQuestion attemptQuestion;

    @Convert(converter = MapObjectConverter.class)
    @Column(columnDefinition = "JSON", nullable = false)
    private Map<String, Object> payload; // ONE/MULTI/TF: selectedAnswerIds; PLAIN_TEXT/ESSAY: text; TABLE_CHOICE: rows[]
}