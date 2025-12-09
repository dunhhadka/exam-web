package com.datn.exam.service.question.importfile.reader;

import com.datn.exam.service.question.importfile.MultiChoiceQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.apache.poi.ss.usermodel.Row;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MultiChoiceReader extends SheetReader<MultiChoiceQuestion> {

    private static final int COL_ANSWERS = 6;
    private static final int COL_CORRECT = 7;

    @Override
    public QuestionSheetType getSupportedSheetType() {
        return QuestionSheetType.MULTI_CHOICE_SHEET;
    }

    @Override
    protected void readSpecificData(MultiChoiceQuestion questionRow, Row row, int rowIndex) {
        String answerString = readCellString(row, COL_ANSWERS);
        if (answerString == null || answerString.isEmpty()) {
            return;
        }

        List<String> answers = splitToList(answerString, "\\|");
        questionRow.setAnswersString(answers);

        questionRow.setCorrectIndexes(readCellListInteger(row, COL_CORRECT));
    }

    @Override
    protected MultiChoiceQuestion createQuestionRow() {
        return new MultiChoiceQuestion();
    }
}
