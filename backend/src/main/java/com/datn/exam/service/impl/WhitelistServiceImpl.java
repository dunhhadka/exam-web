package com.datn.exam.service.impl;

import com.datn.exam.model.dto.response.WhitelistPreviewResponse;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.model.entity.Whitelist;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.repository.WhitelistRepository;
import com.datn.exam.service.S3Service;
import com.datn.exam.service.WhitelistService;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.EmailUtils;
import com.datn.exam.support.util.ExcelUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhitelistServiceImpl implements WhitelistService {
    private final ExamSessionRepository examSessionRepository;
    private final WhitelistRepository whitelistRepository;
    private final S3Service s3Service;
    private static final int MAX_AVATARS_PER_EMAIL = 5;

    @Override
    public WhitelistPreviewResponse previewFromExcel(Long sessionId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseException(BadRequestError.FILE_EMPTY);
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            throw new ResponseException(BadRequestError.INVALID_FILE_FORMAT);
        }

        String sessionName = null;
        Set<String> existingEmails = new HashSet<>();

        if (sessionId != null) {
            ExamSession session = examSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));
            sessionName = session.getName();

            existingEmails.addAll(
                    whitelistRepository.findEmailsBySessionId(sessionId)
                            .stream()
                            .map(String::toLowerCase)
                            .collect(Collectors.toSet())
            );
        }

        List<WhitelistPreviewResponse.EmailItem> allEmails;
        try {
            allEmails = parseEmailWithImages(file);
        } catch (IOException e) {
            log.error("Failed to parse Excel with images", e);
            throw new ResponseException(BadRequestError.INVALID_EXCEL_FILE);
        }

        List<WhitelistPreviewResponse.EmailItem> validEmails = new ArrayList<>();
        List<WhitelistPreviewResponse.EmailItem> invalidEmails = new ArrayList<>();

        for (WhitelistPreviewResponse.EmailItem item : allEmails) {
            if (!EmailUtils.isValidEmail(item.getEmail())) {
                item.setReason("Email không đúng định dạng");
                invalidEmails.add(item);
                continue;
            }

            if (item.getAvatarCount() > MAX_AVATARS_PER_EMAIL) {
                item.setReason(String.format("Tối đa %d ảnh cho 1 email (hiện có %d)",
                        MAX_AVATARS_PER_EMAIL, item.getAvatarCount()));
                invalidEmails.add(item);
                continue;
            }

            validEmails.add(item);
        }

        List<WhitelistPreviewResponse.EmailItem> duplicates = new ArrayList<>();
        if (sessionId != null && !existingEmails.isEmpty()) {
            duplicates = validEmails.stream()
                    .filter(item -> existingEmails.contains(item.getEmail().toLowerCase()))
                    .peek(item -> item.setReason("Email đã tồn tại trong whitelist"))
                    .toList();

            validEmails = validEmails.stream()
                    .filter(item -> !existingEmails.contains(item.getEmail().toLowerCase()))
                    .toList();
        }

        return WhitelistPreviewResponse.builder()
                .sessionId(sessionId)
                .sessionName(sessionName)
                .validEmails(validEmails)
                .invalidEmails(invalidEmails)
                .duplicates(duplicates)
                .totalValid(validEmails.size())
                .totalInvalid(invalidEmails.size())
                .totalDuplicates(duplicates.size())
                .build();
    }

    private List<WhitelistPreviewResponse.EmailItem> parseEmailWithImages(MultipartFile file) throws IOException {
        List<WhitelistPreviewResponse.EmailItem> emails = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Map<Integer, List<String>> rowToAvatarList = new HashMap<>();
            if (sheet instanceof XSSFSheet) {
                rowToAvatarList = extractMultipleImagesAsBase64((XSSFSheet) sheet);
            }

            int rowNumber = 0;
            for (Row row : sheet) {
                rowNumber++;

                // Skip header
                if (rowNumber == 1) {
                    Cell firstCell = row.getCell(0);
                    if (firstCell != null && firstCell.getCellType() == CellType.STRING) {
                        String header = firstCell.getStringCellValue().toLowerCase();
                        if (header.contains("email") || header.contains("mail")) {
                            continue;
                        }
                    }
                }

                Cell emailCell = row.getCell(0);
                if (emailCell == null) continue;

                String email = ExcelUtils.getCellValue(emailCell).trim();
                if (email.isEmpty()) continue;

                List<String> avatars = rowToAvatarList.getOrDefault(rowNumber - 1, new ArrayList<>());

                emails.add(WhitelistPreviewResponse.EmailItem.builder()
                        .row(rowNumber)
                        .email(email)
                        .avatarPreviews(avatars)
                        .avatarCount(avatars.size())
                        .hasAvatars(!avatars.isEmpty())
                        .build());
            }
        }

        return emails;
    }

    private Map<Integer, List<String>> extractMultipleImagesAsBase64(XSSFSheet sheet) {
        Map<Integer, List<String>> rowToAvatars = new HashMap<>();

        XSSFDrawing drawing = sheet.getDrawingPatriarch();
        if (drawing == null) return rowToAvatars;

        for (XSSFShape shape : drawing.getShapes()) {
            if (!(shape instanceof XSSFPicture picture)) continue;

            XSSFPictureData pictureData = picture.getPictureData();
            if (pictureData == null) continue;

            byte[] imageBytes = pictureData.getData();
            String mimeType = pictureData.getMimeType();

            XSSFClientAnchor anchor = (XSSFClientAnchor) picture.getClientAnchor();
            int rowIndex = anchor.getRow1(); // 0-based

            String base64Data = convertToBase64DataUrl(imageBytes, mimeType);
            rowToAvatars.computeIfAbsent(rowIndex, k -> new ArrayList<>()).add(base64Data);
        }

        rowToAvatars.replaceAll((row, avatars) -> {
            if (avatars.size() > MAX_AVATARS_PER_EMAIL) {
                log.warn("Row {} has {} avatars, limit to {}", row + 1, avatars.size(), MAX_AVATARS_PER_EMAIL);
                return avatars.subList(0, MAX_AVATARS_PER_EMAIL);
            }
            return avatars;
        });

        return rowToAvatars;
    }

    @Transactional
    public void addAvatar(Long whitelistId, MultipartFile file) {
        Whitelist whitelist = whitelistRepository.findById(whitelistId)
                .orElseThrow(() -> new ResponseException(NotFoundError.WHITELIST_NOT_FOUND));

        if (whitelist.getAvatarUrls().size() >= MAX_AVATARS_PER_EMAIL) {
            throw new ResponseException(BadRequestError.MAX_AVATARS_REACHED);
        }

        String avatarUrl = uploadAvatarToS3(whitelistId, file);

        whitelist.addAvatar(avatarUrl);
        whitelistRepository.save(whitelist);
    }

    @Transactional
    public void removeAvatar(Long whitelistId, Integer index) {
        Whitelist whitelist = whitelistRepository.findById(whitelistId)
                .orElseThrow(() -> new ResponseException(NotFoundError.WHITELIST_NOT_FOUND));

        if (index < 0 || index >= whitelist.getAvatarUrls().size()) {
            throw new ResponseException(BadRequestError.INVALID_AVATAR_INDEX);
        }

        String removedUrl = whitelist.getAvatarUrls().get(index);
        if (isS3Url(removedUrl)) {
            try {
                s3Service.deleteFile(removedUrl);
            } catch (Exception e) {
                log.error("Failed to delete avatar from S3: {}", removedUrl, e);
            }
        }

        whitelist.removeAvatar(index);
        whitelistRepository.save(whitelist);
    }

    @Transactional
    public void replaceAvatar(Long whitelistId, Integer index, MultipartFile file) {
        Whitelist whitelist = whitelistRepository.findById(whitelistId)
                .orElseThrow(() -> new ResponseException(NotFoundError.WHITELIST_NOT_FOUND));

        if (index < 0 || index >= whitelist.getAvatarUrls().size()) {
            throw new ResponseException(BadRequestError.INVALID_AVATAR_INDEX);
        }

        String oldUrl = whitelist.getAvatarUrls().get(index);
        if (isS3Url(oldUrl)) {
            try {
                s3Service.deleteFile(oldUrl);
            } catch (Exception e) {
                log.error("Failed to delete old avatar from S3: {}", oldUrl, e);
            }
        }

        String newUrl = uploadAvatarToS3(whitelistId, file);
        whitelist.replaceAvatar(index, newUrl);

        whitelistRepository.save(whitelist);
    }

    private String uploadAvatarToS3(Long whitelistId, MultipartFile file) {
        try {
            // Tạo key duy nhất cho file
            String timestamp = String.valueOf(System.currentTimeMillis());
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String key = String.format("whitelists/%d/avatars/%s%s",
                    whitelistId, timestamp, extension);

            return s3Service.uploadFile(file, key);

        } catch (IOException e) {
            log.error("Failed to upload avatar to S3", e);
            throw new ResponseException(BadRequestError.FILE_UPLOAD_FAILED);
        }
    }

    private boolean isS3Url(String url) {
        if (url == null || url.isEmpty()) {
            return false;
        }
        return url.contains(".amazonaws.com") || url.contains("cloudfront.net");
    }

    private String convertToBase64DataUrl(byte[] imageBytes, String mimeType) {
        if (imageBytes == null || imageBytes.length == 0) {
            return null;
        }
        String base64 = Base64.getEncoder().encodeToString(imageBytes);
        return String.format("data:%s;base64,%s", mimeType, base64);
    }
}