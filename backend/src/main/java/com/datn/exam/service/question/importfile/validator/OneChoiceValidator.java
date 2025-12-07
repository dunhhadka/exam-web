package com.datn.exam.service.question.importfile.validator;

import com.datn.exam.service.question.importfile.ImportError;
import com.datn.exam.service.question.importfile.OneChoiceQuestion;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OneChoiceValidator extends SheetValidator<OneChoiceQuestion> {
    @Override
    public QuestionSheetType getSupportSheetType() {
        return QuestionSheetType.ONE_CHOICE_SHEET;
    }

    @Override
    public void validate(OneChoiceQuestion row, List<ImportError> errors) {
        validateBaseField(row, errors);

        validateOneChoiceFields(row, errors);
    }

    private void validateOneChoiceFields(OneChoiceQuestion row, List<ImportError> errors) {
        Integer rowNumber = row.getRowNumber();
        List<String> answers = row.getAnswersString();
        Integer correctIndex = row.getCorrectIndex();

        if (answers == null || answers.isEmpty()) {
            errors.add(ImportError.builder()
                    .rowNumber(rowNumber)
                    .field("answers")
                    .errorMessage("Danh sách đáp án không được để trống")
                    .build());
            return;
        }

        if (answers.size() < 2) {
            errors.add(ImportError.builder()
                    .rowNumber(rowNumber)
                    .field("answers")
                    .errorMessage("Cần ít nhất 2 đáp án")
                    .build());
        }

        for (int i = 0; i < answers.size(); i++) {
            if (StringUtils.isBlank(answers.get(i))) {
                errors.add(ImportError.builder()
                        .rowNumber(rowNumber)
                        .field("answers[" + i + "]")
                        .errorMessage("Đáp án không được để trống")
                        .build());
            }
        }

        if (correctIndex == null) {
            errors.add(ImportError.builder()
                    .rowNumber(rowNumber)
                    .field("correctIndex")
                    .errorMessage("Đáp án đúng không được để trống")
                    .build());
        } else {
            if (correctIndex < 0 || correctIndex >= answers.size()) {
                errors.add(ImportError.builder()
                        .rowNumber(rowNumber)
                        .field("correctIndex")
                        .errorMessage("Đáp án đúng không hợp lệ")
                        .build());
            } else {
                String correctAnswer = answers.get(correctIndex);
                if (StringUtils.isBlank(correctAnswer)) {
                    errors.add(ImportError.builder()
                            .rowNumber(rowNumber)
                            .field("answers[" + correctIndex + "]")
                            .errorMessage("Đáp án đúng không được để trống")
                            .build());
                }
            }
        }
    }
}
