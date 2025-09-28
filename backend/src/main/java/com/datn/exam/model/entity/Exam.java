package com.datn.exam.model.entity;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.apache.commons.collections4.CollectionUtils;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import java.math.BigDecimal;
import java.util.ArrayList;
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

    @OneToMany(mappedBy = "exam", fetch = FetchType.EAGER,cascade = CascadeType.ALL, orphanRemoval = true)
    @Fetch(FetchMode.SUBSELECT)
    private List<ExamQuestion> examQuestions;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "exam_tags",
            joinColumns = @JoinColumn(name = "exam_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags;

    private BigDecimal score; //NOTE: total point

    @Column(name = "is_public")
    private boolean isPublic;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;


    public void setExamQuestions(List<ExamQuestion> newExamQuestion) {
        if (this.examQuestions != null) {
            this.examQuestions.forEach(eq -> eq.setExam(null));
        }

        this.examQuestions = newExamQuestion;

        if (this.examQuestions != null) {
            this.examQuestions.forEach(eq -> eq.setExam(this));
        }
    }

    public void addExamQuestion(ExamQuestion examQuestion) {
        if (this.examQuestions == null) {
            this.examQuestions = new ArrayList<>();
        }
        this.examQuestions.add(examQuestion);
        examQuestion.setExam(this);
    }

    public void removeExamQuestion(ExamQuestion examQuestion) {
        if (this.examQuestions != null) {
            this.examQuestions.remove(examQuestion);
            examQuestion.setExam(null);
        }
    }
}
