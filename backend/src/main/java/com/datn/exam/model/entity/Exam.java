package com.datn.exam.model.entity;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.Status;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "exams")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Exam extends AuditableEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Level level;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamQuestion> examQuestions;

    private BigDecimal score; //NOTE: total point

    @Column(name = "is_public")
    private boolean isPublic;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;
}
