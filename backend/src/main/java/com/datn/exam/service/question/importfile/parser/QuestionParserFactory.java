package com.datn.exam.service.question.importfile.parser;

import com.datn.exam.service.question.importfile.QuestionSheetType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class QuestionParserFactory {

    private final Map<QuestionSheetType, QuestionParser<?>> parserMap;

    public QuestionParserFactory(List<QuestionParser<?>> parsers) {
        this.parserMap = parsers.stream()
                .collect(Collectors.toMap(
                        QuestionParser::getSupportedType,
                        Function.identity()
                ));
    }

    public QuestionParser<?> getParser(QuestionSheetType sheetType) {
        return parserMap.get(sheetType);
    }
}
