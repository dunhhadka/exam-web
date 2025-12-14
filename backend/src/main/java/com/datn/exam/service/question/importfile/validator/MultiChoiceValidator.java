package com.datn.exam.service.question.importfile.validator;

import com.datn.exam.service.question.importfile.ImportError;
import com.datn.exam.service.question.importfile.MultiChoiceQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MultiChoiceValidator extends SheetValidator<MultiChoiceQuestion> {
    @Override
    public QuestionSheetType getSupportSheetType() {
        return QuestionSheetType.MULTI_CHOICE_SHEET;
    }

    @Override
    public void validate(MultiChoiceQuestion row, List<ImportError> errors) {

    }
}
