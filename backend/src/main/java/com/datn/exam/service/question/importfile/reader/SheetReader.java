package com.datn.exam.service.question.importfile;

import org.apache.poi.ss.usermodel.Sheet;

import java.util.List;

public abstract class SheetReader<T extends BaseQuestionRow> {

    protected static final List<String> commonHeaders = List.of();

    abstract QuestionSheetType getSupportedSheetType();

    public abstract List<T> readSheet(Sheet sheet);
}
