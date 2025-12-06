package com.datn.exam.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Log extends AuditableEntity{

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @Enumerated(EnumType.STRING)
    @Column(name = "log_type", nullable = false)
    private LogType logType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity")
    private Severity severity;

    @Column(name = "message", length = 500)
    private String message;

    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt;

    public enum LogType {
        DEVTOOLS_OPEN,
        TAB_SWITCH,
        FULLSCREEN_EXIT,
        COPY_PASTE_ATTEMPT,
        SUSPICIOUS_ACTIVITY,
        LATE_JOIN,
        SUBMISSION,
        OTHER
    }

    public enum Severity {
        INFO,
        WARNING,
        SERIOUS,
        CRITICAL
    }
}
