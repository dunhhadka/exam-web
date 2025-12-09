package com.datn.exam.service.question.exportfile;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class ExportFileService {

    private static final String downloadPath = "templates/excels/import_question.xlsx";

    public ResponseEntity<byte[]> downloadTemplate() throws IOException {
        ClassPathResource resource = new ClassPathResource(downloadPath);

        if (!resource.exists()) {
            throw new RuntimeException("File không tồn tại: " + downloadPath);
        }

        // Đọc file thành byte array
        byte[] fileContent = resource.getInputStream().readAllBytes();

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "import_file_template_" + now + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentLength(fileContent.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(fileContent);
    }
}
