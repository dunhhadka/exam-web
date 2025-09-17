package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class QuestionCreateRequest extends Request{

    @NotBlank(message = "QUESTION_TEXT_REQUIRED")
    private String text;

    @DecimalMin(value = "0.0", message = "QUESTION_IS_POSITIVE")
    @DecimalMax(value = "999.99", message = "QUESTION_MAX_SCORE")
    @NotNull(message = "QUESTION_SCORE_REQUIRED")
    private BigDecimal score;

    @NotNull(message = "QUESTION_LEVEL_REQUIRED")
    private Level level;

    @NotNull(message = "QUESTION_STATUS_REQUIRED")
    private Status status = Status.DRAFT;

    private boolean isPublic = false;

    private List<Long> tagIds;

    private QuestionType type;

    private @Valid List<AnswerCreateRequest> answers;

    // Essay field
    private Integer minWords;
    private Integer maxWords;
    private String simpleAnswer;
    private String gradingCriteria;

    //PlainText
    private String expectedAnswer;
    private Boolean caseSensitive;
    private Boolean exactMatch;

    //TableChoice
    private List<String> headers;
    private List<List<AnswerCreateRequest>> rows;
}
