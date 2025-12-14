package com.datn.exam.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
@Entity
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

    private Integer receiveId;

    private boolean isRead;

    public enum Type {
        ADD_EXAM
    }
}
