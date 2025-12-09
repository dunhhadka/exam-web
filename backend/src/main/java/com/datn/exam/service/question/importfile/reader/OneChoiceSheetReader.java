package com.datn.exam.service.question.importfile.reader;

import com.datn.exam.service.question.importfile.OneChoiceQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class OneChoiceSheetReader extends SheetReader<OneChoiceQuestion> {

    private static final int COL_ANSWERS = 6;
    private static final int COL_CORRECT = 7;

    @Override
    public QuestionSheetType getSupportedSheetType() {
        return QuestionSheetType.ONE_CHOICE_SHEET;
    }

    @Override
    protected void readSpecificData(OneChoiceQuestion questionRow, Row row, int rowIndex) {
        String answerString = readCellString(row, COL_ANSWERS);
        if (answerString == null || answerString.isEmpty()) {
            return;
        }

        List<String> answers = splitToList(answerString, "\\|");
        questionRow.setAnswersString(answers);

        questionRow.setCorrectIndex(readCellInteger(row, COL_CORRECT));
    }

    @Override
    protected OneChoiceQuestion createQuestionRow() {
        return new OneChoiceQuestion();
    }
}
