package com.datn.exam.model.dto.response;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuestionResponse {
    private long id;

    private String text;
    private BigDecimal point;
    private QuestionType type;
    private Level level;
    private Boolean isPublic;
    private Status status;

    private List<TagResponse> tags;
    private List<AnswerResponse> answers;

    // Essay Question
    private Integer maxWords;
    private Integer minWords;
    private String answerAnswer;

    //Plain Text
    private String expectedAnswer;
    private Boolean caseSensitive;
    private Boolean exactMatch;

    //Table Choice
    private List<String> headers;
    private List<RowCompactResponse> rows;

    private Instant createdAt;
    private String createdBy;

    private Instant lastModifiedAt;
    private String lastModifiedBy;

    @Data
    @AllArgsConstructor
    @Builder
    public static class RowCompactResponse {
        private String label;
        private Integer correctIndex;
    }
}
