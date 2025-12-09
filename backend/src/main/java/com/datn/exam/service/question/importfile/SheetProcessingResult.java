package com.datn.exam.service.question.importfile;

import com.datn.exam.model.entity.Question;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class SheetProcessingResult {

    private final String sheetName;
    private List<String> warnings;
    private List<ImportError> errors;

    @JsonIgnore
    private List<Question> validQuestions;

    public SheetProcessingResult(
            String sheetName,
            List<String> warnings,
            List<ImportError> errors,
            List<Question> validQuestions) {

        this.sheetName = sheetName;
        this.warnings = warnings;
        this.errors = errors;
        this.validQuestions = validQuestions;
    }

    public static Builder builder(String sheetName) {
        return new Builder(sheetName);
    }

    public static class Builder {

        private final String sheetName;
        private List<String> warnings;
        private List<ImportError> errors;
        List<Question> validQuestions;

        public Builder(String sheetName) {
            this.sheetName = sheetName;
            this.warnings = new ArrayList<>();
        }

        public Builder isEmpty() {
            hasWarnings()
                    .add("Dữ liệu bị trống sau khi xử lý");

            return this;
        }

        private List<String> hasWarnings() {
            if (this.warnings == null) warnings = new ArrayList<>();
            return warnings;
        }

        public SheetProcessingResult build() {
            return new SheetProcessingResult(
                    sheetName,
                    warnings,
                    errors,
                    validQuestions
            );
        }

        public Builder addErrors(List<ImportError> errors) {
            this.errors = errors;
            return this;
        }

        public Builder addValidQuestion(List<Question> validQuestions) {
            this.validQuestions = validQuestions;
            return this;
        }
    }
}
