package com.datn.exam.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Setter
@Getter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "notifications")
public class Notification extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(columnDefinition = "TEXT")
    private String content;

    @NotNull
    @Enumerated(value = EnumType.STRING)
    private Type type;

    @Column(columnDefinition = "VARCHAR(50)", name = "receive_id")
    private String receiveId;

    @Column(name = "is_read")
    private boolean isRead;

    @Column(name = "is_deleted")
    private boolean isDeleted;

    public enum Type {
        ADD_EXAM, // Thong bao khi add vao bai thi moi
        EXAM_RESULT, // Thong bao ket qua thi
        EXAM_REMINDER, // Thong bao chuan bi den bai thi,(cho ca TEACHER and STUDENT)
        RE_GRADE_EXAM
    }
}
