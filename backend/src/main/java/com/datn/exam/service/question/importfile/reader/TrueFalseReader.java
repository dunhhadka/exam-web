package com.datn.exam.service.question.importfile.reader;

import com.datn.exam.service.question.importfile.QuestionSheetType;
import com.datn.exam.service.question.importfile.TrueFalseQuestion;
import org.apache.poi.ss.usermodel.Row;
import org.springframework.stereotype.Component;

@Component
public class TrueFalseReader extends SheetReader<TrueFalseQuestion> {

    private static final int COL_CORRECT = 6;

    @Override
    public QuestionSheetType getSupportedSheetType() {
        return QuestionSheetType.TRUE_FALSE_SHEET;
    }

    @Override
    protected void readSpecificData(TrueFalseQuestion questionRow, Row row, int rowIndex) {
        questionRow.setCorrectIndex(readCellInteger(row, COL_CORRECT));
    }

    @Override
    protected TrueFalseQuestion createQuestionRow() {
        return new TrueFalseQuestion();
    }
}
