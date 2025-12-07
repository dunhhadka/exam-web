package com.datn.exam.service.question.importfile;

import com.datn.exam.support.util.ExceptionUtils;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class SheetReaderFactory {

    private final Map<QuestionSheetType, SheetReader<?>> readerMap;

    public SheetReaderFactory(List<SheetReader<?>> readers) {
        this.readerMap = readers.stream()
                .collect(Collectors.toMap(
                        SheetReader::getSupportedSheetType,
                        Function.identity()
                ));
    }

    public SheetReader<?> getReader(QuestionSheetType type) {
        var reader = readerMap.get(type);
        if (reader == null) {
            throw ExceptionUtils.withMessage("Chưa implement sheerReader cho " + type.getSheetName());
        }

        return reader;
    }
}
