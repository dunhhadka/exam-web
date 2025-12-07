package com.datn.exam.service.question.importfile;

import lombok.Getter;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Getter
public class MultiSheetImportResult {
    private LocalDateTime timeStamp = LocalDateTime.now();

    private Map<String, SheetProcessingResult> sheetResults = new LinkedHashMap<>();
    private Map<String, String> skippedSheets = new LinkedHashMap<>();
    private Map<String, String> sheetErrors = new LinkedHashMap<>();

    public void addSkippedSheet(String sheetName, String reason) {
        skippedSheets.put(sheetName, reason);
    }

    public void addSheetError(String sheetName, String error) {
        skippedSheets.put(sheetName, error);
    }

    public void addSheetResult(QuestionSheetType sheetType, SheetProcessingResult sheetResult) {
        sheetResults.put(sheetType.getSheetName(), sheetResult);
    }
}
