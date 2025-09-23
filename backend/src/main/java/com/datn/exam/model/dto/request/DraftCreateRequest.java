package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class DraftCreateRequest extends Request implements QuestionCreateBase{
    private String text;

    private BigDecimal point;

    @NotNull(message = "QUESTION_LEVEL_REQUIRED")
    private Level level;


    @NotNull(message = "QUESTION_TYPE_REQUIRE")
    private QuestionType type;

    private boolean isPublic = false;

    private List<Long> tagIds;


    @Valid
    private List<AnswerCreateRequest> answers;

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
