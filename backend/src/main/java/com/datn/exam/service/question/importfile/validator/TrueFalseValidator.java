package com.datn.exam.service.question.importfile.validator;

import com.datn.exam.service.question.importfile.ImportError;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import com.datn.exam.service.question.importfile.TrueFalseQuestion;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TrueFalseValidator extends SheetValidator<TrueFalseQuestion> {
    @Override
    public QuestionSheetType getSupportSheetType() {
        return QuestionSheetType.TRUE_FALSE_SHEET;
    }

    @Override
    public void validate(TrueFalseQuestion row, List<ImportError> errors) {

    }
}
