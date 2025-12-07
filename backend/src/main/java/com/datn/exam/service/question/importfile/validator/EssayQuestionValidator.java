package com.datn.exam.service.question.importfile.validator;

import com.datn.exam.service.question.importfile.EssayQuestion;
import com.datn.exam.service.question.importfile.ImportError;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EssayQuestionValidator extends SheetValidator<EssayQuestion> {
    @Override
    public QuestionSheetType getSupportSheetType() {
        return QuestionSheetType.ESSAY_SHEET;
    }

    @Override
    public void validate(EssayQuestion row, List<ImportError> errors) {

    }
}
