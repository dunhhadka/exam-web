package com.datn.exam.service.question.importfile.validator;

import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class SheetValidatorFactory {

    private final Map<QuestionSheetType, SheetValidator<?>> sheetValidatorMap;

    public SheetValidatorFactory(List<SheetValidator<?>> sheetValidators) {
        this.sheetValidatorMap = sheetValidators.stream()
                .collect(Collectors.toMap(
                        SheetValidator::getSupportSheetType,
                        Function.identity()
                ));
    }

    public SheetValidator<?> getValidator(QuestionSheetType type) {
        return sheetValidatorMap.get(type);
    }
}
