package com.datn.exam.service.question.importfile.reader;

import com.datn.exam.service.question.importfile.BaseQuestionRow;
import com.datn.exam.service.question.importfile.QuestionSheetType;
import com.datn.exam.support.enums.Level;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
public abstract class SheetReader<T extends BaseQuestionRow> {

    private static final int COL_ROW_NUMBER = 0;
    private static final int COL_TEXT = 1;
    private static final int COL_LEVEL = 2;
    private static final int COL_TAGS = 3;
    private static final int COL_IS_PUBLIC = 4;
    private static final int COL_POINT = 5;

    public abstract QuestionSheetType getSupportedSheetType();

    /**
     * Làm nhanh không validate header, excel structure, ...
     * Chỉ cần get đúng value
     * */
    public List<T> readSheet(Sheet sheet) {
        List<T> rowValues = new ArrayList<>();

        Row headerRow = sheet.getRow(0);
        if (headerRow == null) {
            return List.of();
        }

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);

            // Skip if empty row
            if (row == null || isRowEmpty(row)) {
                continue;
            }

            T questionValue = readBaseQuestion(row, i);
            rowValues.add(questionValue);
        }

        return rowValues;
    }

    private T readBaseQuestion(Row row, int rowIndex) {
        T questionRow = createQuestionRow();

        questionRow.setRowNumber(rowIndex + 1);
        questionRow.setText(readCellString(row, COL_TEXT));
        questionRow.setLevel(readCellLevel(row, COL_LEVEL));
        questionRow.setTags(readCellTags(row, COL_TAGS));
        questionRow.setIsPublic(readCellBoolean(row, COL_IS_PUBLIC));
        questionRow.setPoint(readCellBigDecimal(row, COL_POINT));

        readSpecificData(questionRow, row, rowIndex);

        return questionRow;
    }

    protected abstract void readSpecificData(T questionRow, Row row, int rowIndex);

    private BigDecimal readCellBigDecimal(Row row, int columnIndex) {
        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return BigDecimal.ZERO;
        }

        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return BigDecimal.valueOf(cell.getNumericCellValue());
            } else if (cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    return new BigDecimal(value);
                }
            }
        } catch (NumberFormatException e) {
            log.error("error parsing cell {} to BigDecimal",
                    columnIndex);
        }
        return BigDecimal.ZERO;
    }

    protected Boolean readCellBoolean(Row row, int columnIndex) {
        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return false;
        }

        try {
            if (cell.getCellType() == CellType.BOOLEAN) {
                return cell.getBooleanCellValue();
            } else if (cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim().toLowerCase();
                return "true".equals(value) || "1".equals(value) || "yes".equals(value) || "có".equals(value);
            } else if (cell.getCellType() == CellType.NUMERIC) {
                return cell.getNumericCellValue() == 1;
            }
        } catch (Exception e) {
            // Không parse được, return default
        }
        return false;
    }

    protected List<String> readCellTags(Row row, int columnIndex) {
        String tagValues = readCellString(row, columnIndex);
        if (StringUtils.isEmpty(tagValues)) {
            return List.of();
        }

        return Arrays.stream(tagValues.split(","))
                .filter(StringUtils::isNotBlank)
                .map(String::trim)
                .distinct()
                .toList();
    }

    protected Integer readCellInteger(Row row, int columnIndex) {
        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return null;
        }

        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return (int) cell.getNumericCellValue();
            } else if (cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    return Integer.parseInt(value);
                }
            }
        } catch (Exception e) {
            // Return null nếu không parse được
        }
        return null;
    }

    private Level readCellLevel(Row row, int columnIndex) {
        String levelValue = readCellString(row, columnIndex);
        if (StringUtils.isEmpty(levelValue)) {
            return null;
        }

        try {
            return Level.valueOf(levelValue);
        } catch (Exception e) {
            log.error("Error during parse value {} to level in column index {}",
                    levelValue,
                    columnIndex);
            return null;
        }
    }

    private List<String> toTagValues(Row row, int colTags) {
        return List.of();
    }

    protected String readCellString(Row row, int columnIndex) {
        if (row == null) {
            return "";
        }

        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return "";
        }

        try {
            if (cell.getCellType() == CellType.STRING) {
                return StringUtils.trimToEmpty(cell.getStringCellValue());
            } else if (cell.getCellType() == CellType.NUMERIC) {
                return String.valueOf(cell.getNumericCellValue());
            } else if (cell.getCellType() == CellType.BOOLEAN) {
                return String.valueOf(cell.getBooleanCellValue());
            } else if (cell.getCellType() == CellType.FORMULA) {
                return cell.getCellFormula();
            }
        } catch (Exception e) {
            log.error("Error during parse value to String {}", columnIndex);
            return getCellValueString(cell);
        }

        return "";
    }

    protected abstract T createQuestionRow();

    private boolean isRowEmpty(Row row) {
        if (row == null) {
            return true;
        }

        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getCellValueString(cell);
                if (!value.isEmpty()) {
                    return false;
                }
            }
        }

        return true;
    }

    private String getCellValueString(Cell cell) {
        if (cell == null) {
            return "";
        }

        try {
            switch (cell.getCellType()) {
                case STRING:
                    return StringUtils.trimToEmpty(cell.getStringCellValue());
                case NUMERIC:
                    if (DateUtil.isCellDateFormatted(cell)) {
                        return cell.getDateCellValue().toString();
                    } else {
                        // Tránh hiển thị .0 cho số nguyên
                        double num = cell.getNumericCellValue();
                        if (num == Math.floor(num)) {
                            return String.valueOf((int) num);
                        }
                        return String.valueOf(num);
                    }
                case BOOLEAN:
                    return String.valueOf(cell.getBooleanCellValue());
                case FORMULA:
                    return cell.getCellFormula();
                default:
                    return "";
            }
        } catch (Exception e) {
            return "";
        }
    }

    protected List<String> splitToList(String value, String regex) {
        if (value == null || value.isEmpty()) {
            return List.of();
        }

        return Arrays.stream(value.split(regex))
                .filter(StringUtils::isNotBlank)
                .map(String::trim)
                .distinct()
                .toList();
    }

    protected List<Integer> readCellListInteger(Row row, int columnIndex) {
        var value = readCellString(row, columnIndex);
        if (value == null || value.isEmpty()) {
            return List.of();
        }

        return splitToList(value, ",").stream()
                .map(Integer::valueOf)
                .toList();
    }
}
