package com.datn.exam.model.entity;

import com.datn.exam.support.converter.MapObjectConverter;
import com.datn.exam.support.util.InviteCodeUtils;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "exam_sessions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSession extends AuditableEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String code; //NOTE: Mã vào cho thí sinh (ví dụ 6-8 kí tự)
    private String name; // Tên phiên bài kiểm tra

    @Column(name = "student_email")
    private String studentEmail;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "join_token", length = 36, unique = true, nullable = false)
    private String joinToken; //Token dùng cho link/QR

    @Column(name = "start_time")
    private Instant startTime; // Mở cổng vào (nếu null: mở ngay khi phát hành)

    @Column(name = "end_time")
    private Instant endTime; // Đóng cổng vào/hoàn tất

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "late_join_minutes")
    private Integer lateJoinMinutes; // Phút cho phép vào muộn

    @Column(name = "shuffle_questions")
    private boolean shuffleQuestions; // Có xáo trộn câu hỏi hay không

    @Column(name = "shuffle_answers")
    private boolean shuffleAnswers; // Có xáo trộn đáp án hay không

    @Column(name = "is_public")
    private boolean isPublic; // Phiên thì có public hay không

    @Convert(converter = MapObjectConverter.class)
    @Column(columnDefinition = "JSON")
    private Map<String, Object> settings; // setting chống gian lận (key: tên field, value giá trị field;

    @Column(name = "attempt_limit")
    private Integer attemptLimit; // mỗi user, mặc định 1

    @Column(name = "deleted")
    private Boolean deleted = false;

    @ManyToOne
    @JoinColumn(name = "exam_id")
    private Exam exam;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_status")
    private ExamStatus examStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_mode", nullable = false)
    @Builder.Default
    private AccessMode accessMode = AccessMode.PUBLIC;

    public static enum ExamStatus {
        OPEN, CLOSED
    }

    public enum AccessMode {
        PUBLIC,
        WHITELIST,
        PASSWORD
    }

    @PrePersist
    public void prePersist() {
        if (this.code == null || this.code.isBlank()) {
            this.code = InviteCodeUtils.generate();
        }

        if (this.joinToken == null || this.joinToken.isBlank()) {
            this.joinToken = InviteCodeUtils.nextJoinToken();
        }

        if (attemptLimit == null) this.attemptLimit = 1;
    }

    @Transient
    public String buildJoinPath() {
        return "/join/" + this.joinToken; // Path
    }
}
