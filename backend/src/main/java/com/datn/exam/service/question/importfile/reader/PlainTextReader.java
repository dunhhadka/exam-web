package com.datn.exam.service.question.importfile.reader;

import com.datn.exam.service.question.importfile.PlainTextQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.apache.poi.ss.usermodel.Row;
import org.springframework.stereotype.Component;

@Component
public class PlainTextReader extends SheetReader<PlainTextQuestion> {

    private static final int COL_EXPECTED_ANSWER = 6;
    private static final int COL_EXTRACT_MATCH = 7;
    private static final int COL_CASE_SENSITIVE = 8;

    @Override
    public QuestionSheetType getSupportedSheetType() {
        return QuestionSheetType.PLAIN_TEXT_SHEET;
    }

    @Override
    protected void readSpecificData(PlainTextQuestion questionRow, Row row, int rowIndex) {
        questionRow.setExpectedAnswer(readCellString(row, COL_EXPECTED_ANSWER));
        questionRow.setExtractMatch(readCellBoolean(row, COL_EXTRACT_MATCH));
        questionRow.setCaseSensitive(readCellBoolean(row, COL_CASE_SENSITIVE));
    }

    @Override
    protected PlainTextQuestion createQuestionRow() {
        return new PlainTextQuestion();
    }
}
