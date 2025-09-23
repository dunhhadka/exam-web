package com.datn.exam.repository.data.dto;

import com.datn.exam.model.dto.response.TagResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionTagDto {
    private Long questionId;
    private Long id;
    private String name;
    private String slug;
    private String colorCode;

    public TagResponse toTagResponse() {
        return TagResponse.builder()
                .id(id)
                .name(name)
                .slug(slug)
                .colorCode(colorCode)
                .build();
    }
}
