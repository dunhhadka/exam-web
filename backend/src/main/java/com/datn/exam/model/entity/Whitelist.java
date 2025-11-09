package com.datn.exam.model.entity;

import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.support.converter.ListConverter;
import com.datn.exam.support.exception.DomainValidationException;
import com.datn.exam.support.exception.ResponseException;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "whitelists",
        uniqueConstraints = @UniqueConstraint(columnNames = {"exam_session_id", "email"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Whitelist extends AuditableEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_session_id", nullable = false)
    private ExamSession examSession;


    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Convert(converter = ListConverter.class)
    @Column(name = "avatar_urls", columnDefinition = "TEXT")
    @Builder.Default
    private @Size(max = 5) List<String> avatarUrls = new ArrayList<>();

    public void addAvatar(String avatarUrl) {
        if (avatarUrls == null) {
            avatarUrls = new ArrayList<>();
        }
        if (avatarUrls.size() >= 5) {
            throw new IllegalStateException("Cannot add more than 5 avatars");
        }
        avatarUrls.add(avatarUrl);
    }

    public void removeAvatar(int index) {
        if (avatarUrls != null && index >= 0 && index < avatarUrls.size()) {
            avatarUrls.remove(index);
        }
    }

    public void replaceAvatar(int index, String newAvatarUrl) {
        if (avatarUrls != null && index >= 0 && index < avatarUrls.size()) {
            avatarUrls.set(index, newAvatarUrl);
        }
    }

    public boolean hasAvatars() {
        return avatarUrls != null && !avatarUrls.isEmpty();
    }
}