package com.datn.exam.service.question.importfile.reader;

import com.datn.exam.service.question.importfile.EssayQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.apache.poi.ss.usermodel.Row;
import org.springframework.stereotype.Component;

@Component
public class EssayQuestionReader extends SheetReader<EssayQuestion> {
    private static final int COL_MAX_WORDS = 6;
    private static final int COL_MIN_WORDS = 7;
    private static final int COL_SIMPLE_ANSWERS = 8;
    private static final int COL_GRADING_CRITERIA = 9;

    @Override
    public QuestionSheetType getSupportedSheetType() {
        return QuestionSheetType.ESSAY_SHEET;
    }

    @Override
    protected void readSpecificData(EssayQuestion questionRow, Row row, int rowIndex) {
        questionRow.setMaxWords(readCellInteger(row, COL_MAX_WORDS));
        questionRow.setMinWords(readCellInteger(row, COL_MIN_WORDS));
        questionRow.setSimpleAnswer(readCellString(row, COL_SIMPLE_ANSWERS));
        questionRow.setGradingCriteria(readCellString(row, COL_GRADING_CRITERIA));
    }

    @Override
    protected EssayQuestion createQuestionRow() {
        return new EssayQuestion();
    }
}
