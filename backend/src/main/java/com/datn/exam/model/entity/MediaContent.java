package com.datn.exam.model.entity;

import com.datn.exam.support.enums.MediaType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "media_contents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class MediaContent extends AuditableEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaType type; // IMAGE, VIDEO, AUDIO
    
    @Column(nullable = false)
    private String url;
    
    private String fileName;
    
    private String contentType; // MIME type: image/jpeg, video/mp4, audio/mpeg
    
    private Long fileSize; // bytes
    
    private Integer displayOrder;
    
    private String description;
    
    // Thumbnail cho video
    private String thumbnailUrl;
    
    // Duration cho video/audio (seconds)
    private Integer duration;
    
    // Dimensions cho image/video
    private Integer width;
    private Integer height;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id")
    private Answer answer;
    
    @Version
    private Integer version;
}