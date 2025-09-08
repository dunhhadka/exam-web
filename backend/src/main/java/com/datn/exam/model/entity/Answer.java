package com.datn.exam.model.entity;

import com.datn.exam.support.enums.MediaType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


@Entity
@Table(name = "answers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Answer extends AuditableEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Integer orderIndex;
    
    @Column()
    @Size(max = 2000)
    private String value;
    
    @Column(name = "is_correct")
    private Boolean result;
    
    @Column()
    @Size(max = 2000)
    private String explanation;
    
    @OneToMany(mappedBy = "answer", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    private List<MediaContent> mediaContents = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private Question question;

    @Column(name = "explanation_html", columnDefinition = "TEXT")
    private String explanationHtml;

    @Version
    private Integer version;

    // Helper methods for media management
    public void addMediaContent(MediaContent mediaContent) {
        mediaContents.add(mediaContent);
        mediaContent.setAnswer(this);
    }

    public void removeMediaContent(MediaContent mediaContent) {
        mediaContents.remove(mediaContent);
        mediaContent.setAnswer(null);
    }

    // Get media by type
    public List<MediaContent> getImages() {
        return mediaContents.stream()
                .filter(media -> MediaType.IMAGE.equals(media.getType()))
                .collect(Collectors.toList());
    }

    public List<MediaContent> getVideos() {
        return mediaContents.stream()
                .filter(media -> MediaType.VIDEO.equals(media.getType()))
                .collect(Collectors.toList());
    }

    public List<MediaContent> getAudios() {
        return mediaContents.stream()
                .filter(media -> MediaType.AUDIO.equals(media.getType()))
                .collect(Collectors.toList());
    }

    public boolean hasImages() {
        return !getImages().isEmpty();
    }

    public boolean hasVideos() {
        return !getVideos().isEmpty();
    }

    public boolean hasAudios() {
        return !getAudios().isEmpty();
    }

    public boolean hasAnyMedia() {
        return !mediaContents.isEmpty();
    }

    // Backward compatibility - deprecated methods
    @Deprecated
    public List<String> getExplanationImages() {
        return getImages().stream()
                .map(MediaContent::getUrl)
                .collect(Collectors.toList());
    }

    @Deprecated
    public void addExplanationImage(String imageUrl) {
        MediaContent image = MediaContent.builder()
                .type(MediaType.IMAGE)
                .url(imageUrl)
                .displayOrder(mediaContents.size())
                .build();
        addMediaContent(image);
    }
}