package com.datn.exam.service.impl;

import com.datn.exam.model.dto.response.SessionStudentPreviewResponse;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.model.entity.SessionStudent;
import com.datn.exam.model.entity.User;
import com.datn.exam.model.entity.UserInformation;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.repository.SessionStudentRepository;
import com.datn.exam.repository.UserRepository;
import com.datn.exam.service.S3Service;
import com.datn.exam.service.SessionStudentService;
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
public class SessionStudentServiceImpl implements SessionStudentService {
    private final ExamSessionRepository examSessionRepository;
    private final SessionStudentRepository sessionStudentRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    
    private static final int MAX_AVATARS_PER_STUDENT = 5;

    @Override
    public SessionStudentPreviewResponse previewFromExcel(Long sessionId, MultipartFile file) {
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
                    sessionStudentRepository.findByExamSessionId(sessionId)
                            .stream()
                            .map(ss -> ss.getUser().getEmail().toLowerCase())
                            .collect(Collectors.toSet())
            );
        }

        List<SessionStudentPreviewResponse.StudentItem> allStudents;
        try {
            allStudents = parseStudentsWithImages(file);
        } catch (IOException e) {
            log.error("Failed to parse Excel with images", e);
            throw new ResponseException(BadRequestError.INVALID_EXCEL_FILE);
        }

        Set<String> emails = allStudents.stream()
                .map(s -> s.getEmail().toLowerCase())
                .collect(Collectors.toSet());

        List<User> studentsInDb = userRepository.findStudentsByEmails(new ArrayList<>(emails));
        Map<String, User> userByEmail = studentsInDb.stream()
                .collect(Collectors.toMap(
                        u -> u.getEmail().toLowerCase(),
                        u -> u
                ));

        List<SessionStudentPreviewResponse.StudentItem> validStudents = new ArrayList<>();
        List<SessionStudentPreviewResponse.StudentItem> invalidStudents = new ArrayList<>();
        List<SessionStudentPreviewResponse.StudentItem> duplicates = new ArrayList<>();
        List<SessionStudentPreviewResponse.StudentItem> missingStudents = new ArrayList<>();

        for (SessionStudentPreviewResponse.StudentItem item : allStudents) {
            String email = item.getEmail().toLowerCase();

            if (!EmailUtils.isValidEmail(email)) {
                item.setReason("Email không đúng định dạng");
                invalidStudents.add(item);
                continue;
            }

            if (item.getAvatarCount() > MAX_AVATARS_PER_STUDENT) {
                item.setReason(String.format("Tối đa %d ảnh cho 1 student (hiện có %d)",
                        MAX_AVATARS_PER_STUDENT, item.getAvatarCount()));
                invalidStudents.add(item);
                continue;
            }

            if (sessionId != null && existingEmails.contains(email)) {
                item.setReason("Student đã được assign vào session này");
                duplicates.add(item);
                continue;
            }

            User user = userByEmail.get(email);
            if (user == null) {
                item.setReason("User không tồn tại trong hệ thống hoặc không có role STUDENT");
                missingStudents.add(item);
                continue;
            }

            String fullName = Optional.ofNullable(user.getInformation())
                    .map(UserInformation::buildFullName)
                    .orElse("");

            item.setFullName(fullName);
            validStudents.add(item);
        }

        return SessionStudentPreviewResponse.builder()
                .sessionId(sessionId)
                .sessionName(sessionName)
                .validStudents(validStudents)
                .invalidStudents(invalidStudents)
                .duplicates(duplicates)
                .missingStudents(missingStudents)
                .totalValid(validStudents.size())
                .totalInvalid(invalidStudents.size())
                .totalDuplicates(duplicates.size())
                .totalMissing(missingStudents.size())
                .build();
    }

    private List<SessionStudentPreviewResponse.StudentItem> parseStudentsWithImages(MultipartFile file) throws IOException {
        List<SessionStudentPreviewResponse.StudentItem> students = new ArrayList<>();

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

                students.add(SessionStudentPreviewResponse.StudentItem.builder()
                        .row(rowNumber)
                        .email(email)
                        .avatarPreviews(avatars)
                        .avatarCount(avatars.size())
                        .hasAvatars(!avatars.isEmpty())
                        .build());
            }
        }

        return students;
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
            if (avatars.size() > MAX_AVATARS_PER_STUDENT) {
                log.warn("Row {} has {} avatars, limit to {}", row + 1, avatars.size(), MAX_AVATARS_PER_STUDENT);
                return avatars.subList(0, MAX_AVATARS_PER_STUDENT);
            }
            return avatars;
        });

        return rowToAvatars;
    }

    @Transactional
    @Override
    public void addAvatar(Long sessionStudentId, MultipartFile file) {
        SessionStudent student = sessionStudentRepository.findById(sessionStudentId)
                .orElseThrow(() -> new ResponseException(NotFoundError.SESSION_STUDENT_NOT_FOUND));

        if (student.getAvatarUrls().size() >= MAX_AVATARS_PER_STUDENT) {
            throw new ResponseException(BadRequestError.MAX_AVATARS_REACHED);
        }

        String avatarUrl = uploadAvatarToS3(sessionStudentId, file);

        List<String> avatars = new ArrayList<>(student.getAvatarUrls());
        avatars.add(avatarUrl);
        student.setAvatarUrls(avatars);
        
        sessionStudentRepository.save(student);
    }

    @Transactional
    @Override
    public void removeAvatar(Long sessionStudentId, Integer index) {
        SessionStudent student = sessionStudentRepository.findById(sessionStudentId)
                .orElseThrow(() -> new ResponseException(NotFoundError.SESSION_STUDENT_NOT_FOUND));

        if (index < 0 || index >= student.getAvatarUrls().size()) {
            throw new ResponseException(BadRequestError.INVALID_AVATAR_INDEX);
        }

        String removedUrl = student.getAvatarUrls().get(index);
        if (isS3Url(removedUrl)) {
            try {
                s3Service.deleteFile(removedUrl);
            } catch (Exception e) {
                log.error("Failed to delete avatar from S3: {}", removedUrl, e);
            }
        }

        List<String> avatars = new ArrayList<>(student.getAvatarUrls());
        avatars.remove(index.intValue());
        student.setAvatarUrls(avatars);
        
        sessionStudentRepository.save(student);
    }

    @Transactional
    @Override
    public void replaceAvatar(Long sessionStudentId, Integer index, MultipartFile file) {
        SessionStudent student = sessionStudentRepository.findById(sessionStudentId)
                .orElseThrow(() -> new ResponseException(NotFoundError.SESSION_STUDENT_NOT_FOUND));

        if (index < 0 || index >= student.getAvatarUrls().size()) {
            throw new ResponseException(BadRequestError.INVALID_AVATAR_INDEX);
        }

        String oldUrl = student.getAvatarUrls().get(index);
        if (isS3Url(oldUrl)) {
            try {
                s3Service.deleteFile(oldUrl);
            } catch (Exception e) {
                log.error("Failed to delete old avatar from S3: {}", oldUrl, e);
            }
        }

        String newUrl = uploadAvatarToS3(sessionStudentId, file);
        
        List<String> avatars = new ArrayList<>(student.getAvatarUrls());
        avatars.set(index, newUrl);
        student.setAvatarUrls(avatars);

        sessionStudentRepository.save(student);
    }

    private String uploadAvatarToS3(Long sessionStudentId, MultipartFile file) {
        try {
            String timestamp = String.valueOf(System.currentTimeMillis());
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String key = String.format("session-students/%d/avatars/%s%s",
                    sessionStudentId, timestamp, extension);

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
