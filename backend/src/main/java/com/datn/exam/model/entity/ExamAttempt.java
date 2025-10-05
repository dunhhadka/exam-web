package com.datn.exam.model.entity;

import com.datn.exam.support.converter.MapObjectConverter;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;

@Entity
@Table(name = "exam_attempts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExamAttempt extends AuditableEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "exam_session_id", nullable = false)
    private ExamSession examSession;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "attempt_no", nullable = false)
    private Integer attemptNo;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "auto_submitted_at")
    private Instant autoSubmittedAt;

    @Column(name = "score_auto")
    private BigDecimal scoreAuto; // Điểm chấm tự động

    @Column(name = "score_manual")
    private BigDecimal scoreManual; // Điềm giáo viên chấm lại

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AttemptStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "grading_status")
    private GradingStatus gradingStatus;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "device_info")
    private String deviceInfo;

    @Column(name = "identity_photo_url")
    private String identityPhotoUrl;

    @Column(name = "webcam_stream_url")
    private String webcamStreamUrl;

    @Convert(converter = MapObjectConverter.class)
    @Column(name = "snapshot_exam")
    private Map<String, Objects> snapshotExam;

    public enum GradingStatus {
        PENDING,
        DONE
    }

    public enum AttemptStatus {
        IN_PROGRESS,
        SUBMITTED,
        EXPIRED,
        ABANDONED, // Thoát ra giữa chừng
        CANCELLED, // Bị hủy bài thi
        GRADED, // Đã chấm điểm xong: được chấp thuận bài thi
        TERMINATED // Bị dừng do vi phạm gian lận
    }
}
