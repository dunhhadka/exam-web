package com.datn.exam.service.question.importfile.validator;

import com.datn.exam.service.question.importfile.ImportError;
import com.datn.exam.service.question.importfile.PlainTextQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PlainTextValidator extends SheetValidator<PlainTextQuestion> {
    @Override
    public QuestionSheetType getSupportSheetType() {
        return QuestionSheetType.PLAIN_TEXT_SHEET;
    }

    @Override
    public void validate(PlainTextQuestion row, List<ImportError> errors) {

    }
}
