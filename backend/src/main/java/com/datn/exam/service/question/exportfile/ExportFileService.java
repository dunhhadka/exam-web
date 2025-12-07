package com.datn.exam.service.question.exportfile;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class ExportFileService {

    private static final String downloadPath = "templates/excels/import_question.xlsx";

    public ResponseEntity<Resource> downloadTemplate() throws IOException {
        Resource resource = new ClassPathResource(downloadPath);

        if (!resource.exists()) {
            throw new RuntimeException("Template file không tồn tại");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"import_question_template.xlsx\"");
        headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(resource.contentLength())
                .body(resource);
    }
}
