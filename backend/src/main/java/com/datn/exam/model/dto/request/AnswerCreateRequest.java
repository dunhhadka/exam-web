package com.datn.exam.model.dto.request;

import com.datn.exam.support.constants.ValidateConstraint;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class AnswerCreateRequest extends Request{
    @Size(max = 2000, message = "ANSWER_MAX_VALUE")
    private String value;

    @NotNull(message = "ANSWER_RESULT_REQUIRED")
    private Boolean result;

    @Size(max = ValidateConstraint.Length.ANSWER_MAX_EXPLANATION, message = "ANSWER_MAX_EXPLANATION")
    private String explanation;

    @Size(max = ValidateConstraint.Length.ANSWER_MAX_EXPLANATION_HTML, message = "ANSWER_MAX_EXPLANATION_HTML")
    private String explanationHtml;
}
