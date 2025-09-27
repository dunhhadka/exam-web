package com.datn.exam.service.validation;

import com.datn.exam.model.dto.request.QuestionCreateBase;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.support.enums.QuestionType;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TableChoicePublishValidator {

    public List<InvalidFieldError> validate(QuestionCreateBase request, String objectName) {
        List<InvalidFieldError> errors = new ArrayList<>();
        if (request.getType() != QuestionType.TABLE_CHOICE) return errors;

        List<String> headers = request.getHeaders();
        List<QuestionCreateRequest.RowCompactRequest> rows = request.getRows();

        if (CollectionUtils.isEmpty(headers) || headers.size() < 2) {
            errors.add(err(objectName, "headers", "QUESTION_TABLE_HEADER_MIN_2"));
            return errors;
        }
        for (int h = 0; h < headers.size(); h++) {
            if (StringUtils.isBlank(headers.get(h))) {
                errors.add(err(objectName, "headers[" + h + "]", "QUESTION_TABLE_HEADER_REQUIRED"));
            }
        }

        if (CollectionUtils.isEmpty(rows)) {
            errors.add(err(objectName, "rows", "QUESTION_TABLE_ROW_MIN_1"));
            return errors;
        }

        int colCount = headers.size();
        for (int r = 0; r < rows.size(); r++) {
            QuestionCreateRequest.RowCompactRequest row = rows.get(r);

            if (row == null) {
                errors.add(err(objectName, "rows[" + r + "]", "QUESTION_ROW_EMPTY"));
                continue;
            }

            if (StringUtils.isBlank(row.getLabel())) {
                errors.add(err(objectName, "rows[" + r + "].label", "QUESTION_ROW_LABEL_REQUIRED"));
            }

            Integer correctIdx = row.getCorrectIndex();
            if (correctIdx == null) {
                errors.add(err(objectName, "rows[" + r + "].correctIndex", "QUESTION_ROW_CORRECT_INDEX_REQUIRED"));
            } else if (correctIdx < 0 || correctIdx >= colCount) {
                errors.add(err(objectName, "rows[" + r + "].correctIndex", "QUESTION_ROW_CORRECT_INDEX_INVALID"));
            }
        }

        return errors;
    }

    private InvalidFieldError err(String objectName, String field, String message) {
        return InvalidFieldError.builder()
                .objectName(objectName)
                .field(field)
                .message(message)
                .build();
    }
}
