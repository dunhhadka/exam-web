package com.datn.exam.service.question.importfile;

import java.util.List;

public interface SheetValidator<T extends BaseQuestionRow> {

    QuestionSheetType getSupportSheetType();

    void validate(T row, List<ImportError> errors);
}
