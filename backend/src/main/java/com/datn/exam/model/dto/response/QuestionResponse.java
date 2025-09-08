package com.datn.exam.model.dto.response;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class QuestionResponse {
    private long id;

    private String text;
    private BigDecimal score;
    private QuestionType type;
    private Level level;
    private Boolean isPublic;
    private Boolean isPublish;

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

    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;

}
