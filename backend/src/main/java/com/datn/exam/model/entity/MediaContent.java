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

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "content_type")
    private String contentType; // MIME type: image/jpeg, video/mp4, audio/mpeg

    @Column(name = "file_size")
    private Long fileSize; // bytes

    @Column(name = "display_order")
    private Integer displayOrder;
    
    private String description;
    
    @Column(name = "thumbnail_url")
    private String thumbnailUrl; // Thumbnail for video
    
    // Duration cho video/audio (seconds)
    private Integer duration; // Duration for video/
    
    // Dimensions cho image/video
    private Integer width;
    private Integer height;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id")
    private Answer answer;
    
    @Version
    private Integer version;
}