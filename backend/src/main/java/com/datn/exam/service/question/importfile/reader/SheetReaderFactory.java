package com.datn.exam.service.question.importfile.reader;

import com.datn.exam.service.question.importfile.BaseQuestionRow;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import com.datn.exam.support.util.ExceptionUtils;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class SheetReaderFactory {

    private final Map<QuestionSheetType, SheetReader<?>> readerMap;

    public SheetReaderFactory(List<SheetReader<? extends BaseQuestionRow>> readers) {
        this.readerMap = readers.stream()
                .collect(Collectors.toMap(
                        SheetReader::getSupportedSheetType,
                        Function.identity()
                ));
    }

    @SuppressWarnings("unchecked")
    public <T extends BaseQuestionRow> SheetReader<T> getReader(QuestionSheetType type) {
        var reader = readerMap.get(type);
        if (reader == null) {
            throw ExceptionUtils.withMessage("Chưa implement sheerReader cho " + type.getSheetName());
        }

        return (SheetReader<T>) reader;
    }
}
