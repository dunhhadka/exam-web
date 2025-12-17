package com.datn.exam.model.entity;

import com.datn.exam.support.converter.ListConverter;
import com.datn.exam.support.enums.SessionStudentStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "session_students")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionStudent extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_session_id", nullable = false)
    private ExamSession examSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // User with role STUDENT

    @Convert(converter = ListConverter.class)
    @Column(name = "avatar_urls", columnDefinition = "TEXT")
    @Builder.Default
    private @Size(max = 5) List<String> avatarUrls = new ArrayList<>();
}