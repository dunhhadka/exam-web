package com.datn.exam.service.question;

import com.datn.exam.model.dto.request.question.QuestionImportRequest;
import com.datn.exam.model.entity.Question;
import com.datn.exam.repository.QuestionRepository;
import com.datn.exam.service.question.importfile.*;
import com.datn.exam.service.question.importfile.parser.QuestionParser;
import com.datn.exam.service.question.importfile.parser.QuestionParserFactory;
import com.datn.exam.service.question.importfile.reader.SheetReader;
import com.datn.exam.service.question.importfile.reader.SheetReaderFactory;
import com.datn.exam.service.question.importfile.validator.SheetValidator;
import com.datn.exam.service.question.importfile.validator.SheetValidatorFactory;
import com.datn.exam.support.util.ExceptionUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionImportService {

    private final SheetReaderFactory sheetReaderFactory;
    private final SheetValidatorFactory validatorFactory;
    private final QuestionParserFactory parserFactory;

    private final QuestionRepository questionRepository;

    @Transactional
    public MultiSheetImportResult importFromFile(QuestionImportRequest request) {

        MultiSheetImportResult result = new MultiSheetImportResult();

        try (ByteArrayInputStream bis = new ByteArrayInputStream(request.getFileData())) {
            Workbook workbook = WorkbookFactory.create(bis);

            var sheetTypes = validateFileStructure(workbook, result);
            if (sheetTypes.isEmpty()) {
                return result;
            }

            for (var sheetInfo : sheetTypes.entrySet()) {
                SheetProcessingResult processingSheetResult = processSheet(sheetInfo.getKey(), sheetInfo.getValue());

                result.addSheetResult(sheetInfo.getKey(), processingSheetResult);

                if (CollectionUtils.isNotEmpty(processingSheetResult.getValidQuestions())) {
                    questionRepository.saveAll(processingSheetResult.getValidQuestions());
                    log.info("Saved {} question from sheet: {}",
                            processingSheetResult.getValidQuestions().size(),
                            sheetInfo.getKey().getSheetName()
                    );
                }
            }

        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return result;
    }

    @SuppressWarnings("unchecked")
    private <T extends BaseQuestionRow> SheetProcessingResult processSheet(
            QuestionSheetType sheetType,
            Sheet sheet) {

        SheetReader<T> reader = sheetReaderFactory.getReader(sheetType);

        List<T> rows = reader.readSheet(sheet);

        SheetProcessingResult.Builder builder = SheetProcessingResult.builder(sheetType.getSheetName());

        if (rows.isEmpty()) {
            log.warn("Sheet {} is empty", sheetType.getSheetName());
            return builder.isEmpty()
                    .build();
        }

        SheetValidator validator = validatorFactory.getValidator(sheetType);
        QuestionParser parser = parserFactory.getParser(sheetType);

        List<ImportError> allErrors = new ArrayList<>();
        List<Question> validQuestions = new ArrayList<>();

        for (BaseQuestionRow row : rows) {
            List<ImportError> errors = new ArrayList<>();

            validator.validate(row, errors);

            if (!errors.isEmpty()) {
                allErrors.addAll(errors);
                continue;
            }

            try {
                Question question = parser.parse(row);
                validQuestions.add(question);
            } catch (Exception e) {
                log.error("Error parsing row {} in sheet {}",
                        row.getRowNumber(),
                        sheetType.getSheetName());

                allErrors.add(ImportError.builder()
                        .rowNumber(row.getRowNumber())
                        .field("parsing")
                        .errorMessage(e.getMessage())
                        .build());
            }
        }

        builder.addErrors(allErrors);
        builder.addValidQuestion(validQuestions);

        return builder.build();
    }

    private Map<QuestionSheetType, Sheet> validateFileStructure(
            Workbook workbook,
            MultiSheetImportResult result) {

        var numberOfSheets = workbook.getNumberOfSheets();

        if (numberOfSheets == 0) {
            throw ExceptionUtils.withMessage("File Excel không có sheet nào");
        }

        var sheetResults = new LinkedHashMap<QuestionSheetType, Sheet>();

        for (int i = 0; i < numberOfSheets; i++) {
            String sheetName = workbook.getSheetAt(i).getSheetName();

            Optional<QuestionSheetType> sheetType = QuestionSheetType.getBySheetName(sheetName);
            if (sheetType.isEmpty()) {
                log.warn("Shipping handle sheet with name {}", sheetName);
                result.addSkippedSheet(sheetName, "SheetName " + sheetName + " không hợp lệ hoặc chưa hỗ trợ import loại câu hỏi.");
                continue;
            }

            sheetResults.put(sheetType.get(), workbook.getSheetAt(i));
        }

        return sheetResults;
    }
}
