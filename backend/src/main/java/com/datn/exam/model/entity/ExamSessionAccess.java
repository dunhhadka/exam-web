package com.datn.exam.model.entity;

import com.datn.exam.support.enums.ActiveStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "exam_session_access",
        uniqueConstraints = @UniqueConstraint(name = "uq_session_email", columnNames = {"exam_session_id","email"}))
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSessionAccess extends AuditableEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_session_id", nullable = false)
    private ExamSession examSession;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccessStatus status;

    @Column(name = "otp_hash")
    private String otpHash;

    @Column(name = "otp_salt")
    private String otpSalt;

    @Column(name = "otp_expires_at")
    private Instant otpExpiresAt;

    private Integer failedAttempts;
    private Integer resendCount;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = AccessStatus.PENDING;
        if (failedAttempts == null) failedAttempts = 0;
        if (resendCount == null) resendCount = 0;
    }

    public enum AccessStatus {
        PENDING,
        VERIFIED,
        BLOCKED
    }
}
