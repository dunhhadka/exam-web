package com.datn.exam.service.question.importfile;

import org.apache.poi.ss.usermodel.Sheet;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OneChoiceSheetReader extends SheetReader<OneChoiceQuestion> {
    @Override
    QuestionSheetType getSupportedSheetType() {
        return QuestionSheetType.ONE_CHOICE_SHEET;
    }

    @Override
    public List<OneChoiceQuestion> readSheet(Sheet sheet) {
        return List.of();
    }
}
