package com.datn.exam.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name="emails")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Email extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_email")
    private String from;

    @Column(name = "to_email")
    private String to;

    private String subject;

    private String otp;

    @Column(name = "template_name")
    private String templateName;

    @Column(name = "expires_minutes")
    private Integer expiresMinutes;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "late_join_minutes")
    private Integer lateJoinMinutes;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "retry_count")
    private Integer retryCount;

    @Column(name = "attempt_id")
    private Long attemptId;

    public static enum Status {
        PENDING,
        SENT,
        FAILED
    }
}
