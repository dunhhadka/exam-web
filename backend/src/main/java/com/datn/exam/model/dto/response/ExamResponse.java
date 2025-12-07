package com.datn.exam.model.dto.response;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class ExamResponse {
    private long id;
    private String name;
    private Level level;
    private List<ExamQuestionResponse> examQuestion;
    private BigDecimal score;
    private boolean isPublic;
    private Status status;

    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;

    @Getter
    @Setter
    public static class ExamQuestionResponse {
        private long id;
        private String text;
        private BigDecimal point;
        private Level level;
        private List<TagResponse> tags;
        private QuestionType type;
    }
}
