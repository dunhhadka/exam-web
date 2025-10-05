package com.datn.exam.model.entity;

import com.datn.exam.support.converter.MapObjectConverter;
import com.datn.exam.support.enums.QuestionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Entity
@Table(name = "exam_attempt_questions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExamAttemptQuestion extends AuditableEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "exam_question_id")
    private Long examQuestionId;

    @Column(name = "orderIndex")
    private Integer orderIndex;

    private QuestionType type;

    private BigDecimal point; // Điểm snapshot

    @Column(name = "question_snapshot")
    @Convert(converter = MapObjectConverter.class)
    private Map<String, Object> questionSnapshot;

    @Column(name = "auto_score")
    private BigDecimal autoScore;

    @Column(name = "manual_score")
    private BigDecimal manualScore;

    private Boolean correct;
}
