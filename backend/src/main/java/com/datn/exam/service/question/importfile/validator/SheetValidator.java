package com.datn.exam.service.question.importfile.validator;

import com.datn.exam.service.question.importfile.BaseQuestionRow;
import com.datn.exam.service.question.importfile.ImportError;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.apache.commons.lang3.StringUtils;

import java.math.BigDecimal;
import java.util.List;

public abstract class SheetValidator<T extends BaseQuestionRow> {

    public abstract QuestionSheetType getSupportSheetType();

    public abstract void validate(T row, List<ImportError> errors);

    protected void validateBaseField(T row, List<ImportError> errors) {
        Integer rowNumber = row.getRowNumber();

        if (StringUtils.isBlank(row.getText())) {
            errors.add(ImportError.builder()
                    .rowNumber(rowNumber)
                    .field("text")
                    .errorMessage("Câu hỏi không được để trống")
                    .build());
        }

        if (row.getLevel() == null) {
            errors.add(ImportError.builder()
                    .rowNumber(rowNumber)
                    .field("level")
                    .errorMessage("Mức độ không được để trống")
                    .build());
        }

        if (row.getPoint() == null) {
            errors.add(ImportError.builder()
                    .rowNumber(rowNumber)
                    .field("point")
                    .errorMessage("Điểm không được để trống")
                    .build());
        } else if (row.getPoint().compareTo(BigDecimal.ZERO) <= 0) {
            errors.add(ImportError.builder()
                    .rowNumber(rowNumber)
                    .field("point")
                    .errorMessage("Điểm phải lớn hơn 0")
                    .build());
        }
    }
}
