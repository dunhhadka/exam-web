package com.datn.exam.service.question.importfile;

import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.util.ExceptionUtils;
import lombok.Getter;
import org.apache.commons.lang3.StringUtils;

import java.util.Arrays;
import java.util.Optional;

@Getter
public enum QuestionSheetType {
    ONE_CHOICE_SHEET(QuestionType.ONE_CHOICE, "Trắc nghiệm chọn một"),
    MULTI_CHOICE_SHEET(QuestionType.MULTI_CHOICE, "Trắc nghiệm chọn nhiều"),
    TRUE_FALSE_SHEET(QuestionType.TRUE_FALSE, "Trắc nghiệm đúng sai"),
    PLAIN_TEXT_SHEET(QuestionType.PLAIN_TEXT, "Đoạn văn"),
    TABLE_CHOICE_SHEET(QuestionType.TABLE_CHOICE, "Trắc nghiệm bảng"),
    ESSAY_SHEET(QuestionType.ESSAY, "Tiểu luận");

    private final QuestionType type;
    private final String sheetName;

    QuestionSheetType(QuestionType type, String sheetName) {
        this.type = type;
        this.sheetName = sheetName;
    }

    public static Optional<QuestionSheetType> getBySheetName(String sheetName) {
        if (StringUtils.isBlank(sheetName)) {
            throw ExceptionUtils.withMessage("SheetName không dươc để trống");
        }

        return findSheetTypeByName(sheetName.trim());
    }

    private static Optional<QuestionSheetType> findSheetTypeByName(String sheetName) {
        return Arrays.stream(values())
                .filter(sheet -> sheet.sheetName.equalsIgnoreCase(sheetName))
                .findFirst();
    }
}
