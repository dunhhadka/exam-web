package com.datn.exam.model.dto.response;

import com.datn.exam.support.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class MediaContentResponse {
    private long id;
    private MediaType type;
    private String url;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private Integer displayOrder;
    private String thumbnailUrl;
    private Integer duration;
    private Integer width;
    private Integer height;
}
