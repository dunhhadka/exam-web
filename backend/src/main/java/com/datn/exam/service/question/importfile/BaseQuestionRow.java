package com.datn.exam.service.question.importfile;

import com.datn.exam.model.dto.request.QuestionCreateBase;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
import com.datn.exam.support.enums.Level;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public abstract class BaseQuestionRow implements QuestionCreateBase {
    private Integer rowNumber;

    private Level level;
    private List<String> tags;
    private String text;
    private Boolean isPublic;
    private BigDecimal point;

    @Override
    public boolean isPublic() {
        return isPublic != null && isPublic;
    }

    @Override
    public List<Long> getTagIds() {
        return List.of();
    }

    @Override
    public String getExpectedAnswer() {
        return "";
    }

    @Override
    public Boolean getCaseSensitive() {
        return null;
    }

    @Override
    public Boolean getExactMatch() {
        return null;
    }

    @Override
    public Integer getMinWords() {
        return 0;
    }

    @Override
    public Integer getMaxWords() {
        return 0;
    }

    @Override
    public String getSimpleAnswer() {
        return "";
    }

    @Override
    public String getGradingCriteria() {
        return "";
    }

    @Override
    public List<String> getHeaders() {
        return List.of();
    }

    @Override
    public List<QuestionCreateRequest.RowCompactRequest> getRows() {
        return List.of();
    }
}
