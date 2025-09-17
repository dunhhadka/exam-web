package com.datn.exam.model.dto.request;

import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.Status;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class DraftCreateRequest extends Request{
    private String text;

    private String score;

    private Level level;

    private Status status = Status.DRAFT;

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
