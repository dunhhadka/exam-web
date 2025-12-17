package com.datn.exam.service.impl;

import com.datn.exam.model.dto.ExamSessionSetting;
import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.mapper.ExamSessionMapper;
import com.datn.exam.model.dto.request.ExamSessionFilterRequest;
import com.datn.exam.model.dto.request.ExamSessionRequest;
import com.datn.exam.model.dto.request.IdsRequest;
import com.datn.exam.model.dto.request.PrivateAccessConfig;
import com.datn.exam.model.dto.request.SessionUserFilterRequest;
import com.datn.exam.model.dto.request.StudentImportEntry;
import com.datn.exam.model.dto.response.ExamSessionResponse;
import com.datn.exam.model.dto.response.SessionStatsResponse;
import com.datn.exam.model.dto.response.SessionStudentEntryResponse;
import com.datn.exam.model.dto.response.SessionStudentResponse;
import com.datn.exam.model.dto.response.SessionUserResponse;
import com.datn.exam.model.entity.Exam;
import com.datn.exam.model.entity.ExamAttempt;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.model.entity.SessionStudent;
import com.datn.exam.model.entity.User;
import com.datn.exam.repository.ExamAttemptRepository;
import com.datn.exam.repository.ExamRepository;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.repository.SessionStudentRepository;
import com.datn.exam.repository.UserRepository;
import com.datn.exam.repository.data.dao.ExamSessionDao;
import com.datn.exam.repository.data.dto.ExamSessionDto;
import com.datn.exam.service.ExamSessionService;
import com.datn.exam.service.S3Service;
import com.datn.exam.support.enums.error.AuthorizationError;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.InviteCodeUtils;
import com.datn.exam.support.util.JsonUtils;
import com.datn.exam.support.util.EmailUtils;
import com.datn.exam.support.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Slf4j
public class ExamSessionServiceImpl implements ExamSessionService {
    private final ExamSessionRepository examSessionRepository;
    private final ExamRepository examRepository;
    private final ExamSessionDao examSessionDao;
    private final ExamSessionMapper examSessionMapper;
    private final ExamAttemptRepository examAttemptRepository;
    private final S3Service s3Service;
    private final SessionStudentRepository sessionStudentRepository;
    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;


    @Transactional
    @Override
    public ExamSessionResponse create(ExamSessionRequest request) {
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_NOT_FOUND));

        this.validateWindow(request.getStartTime(), request.getEndTime());
        this.validateSettings(request);
        
        ExamSession.AccessMode accessMode = Optional.ofNullable(request.getAccessMode())
                .orElse(ExamSession.AccessMode.PUBLIC);
        this.validateAccessRequirements(accessMode, request, null);

        String code = InviteCodeUtils.generate();
        while (examSessionRepository.existsByCode(code)) code = InviteCodeUtils.generate();

        String token = InviteCodeUtils.nextJoinToken();
        while (examSessionRepository.existsByJoinToken(token)) token = InviteCodeUtils.nextJoinToken();

        Map<String, Object> settingsMap = JsonUtils.toMap(request.getSettings());

        boolean publicFlag = accessMode == ExamSession.AccessMode.PUBLIC && request.isPublic();

        ExamSession session = ExamSession.builder()
                .exam(exam)
                .name(request.getName())
                .code(code)
                .joinToken(token)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .durationMinutes(request.getDurationMinutes())
                .lateJoinMinutes(request.getLateJoinMinutes())
                .shuffleQuestions(request.isShuffleQuestion())
                .shuffleAnswers(request.isShuffleAnswers())
                .isPublic(publicFlag)
                .accessMode(accessMode)
                .accessPassword(null) // Removed PASSWORD mode
                .attemptLimit(request.getAttemptLimit())
                .settings(settingsMap)
                .examStatus(ExamSession.ExamStatus.OPEN)
                .deleted(Boolean.FALSE)
                .build();

        examSessionRepository.save(session);

        List<SessionStudent> sessionStudents = synchronizeSessionStudents(session, request);

        return buildExamSessionResponse(session, sessionStudents);
    }


    @Override
    @Transactional
    public ExamSessionResponse update(Long id, ExamSessionRequest request) {
        Optional<String> username = SecurityUtils.getCurrentUser();

        ExamSession examSession = examSessionRepository.findById(id)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND, id));

        if (!Objects.equals(username.get(), examSession.getCreatedBy())) {
            throw new ResponseException(AuthorizationError.ACCESS_DENIED);
        }

        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_NOT_FOUND, request.getExamId()));

        this.validateWindow(request.getStartTime(), request.getEndTime());
        this.validateSettings(request);

        ExamSession.AccessMode accessMode = Optional.ofNullable(request.getAccessMode())
                .orElse(examSession.getAccessMode());
        this.validateAccessRequirements(accessMode, request, examSession);

        String code = examSession.getCode();
        String joinToken = examSession.getJoinToken();

        examSessionMapper.updateExamSession(examSession, request);
        examSession.setExam(exam);
        examSession.setCode(code);
        examSession.setJoinToken(joinToken);
        examSession.setAccessMode(accessMode);
        boolean publicFlag = accessMode == ExamSession.AccessMode.PUBLIC && request.isPublic();
        examSession.setPublic(publicFlag);
        examSession.setAccessPassword(null); // Removed PASSWORD mode

        examSessionRepository.save(examSession);

        List<SessionStudent> sessionStudents = synchronizeSessionStudents(examSession, request);

        return buildExamSessionResponse(examSession, sessionStudents);
    }


    @Override
    public PageDTO<ExamSessionResponse> filter(ExamSessionFilterRequest request) {
        Long count = this.examSessionDao.count(request);

        if (Objects.equals(count, 0L)) {
            return PageDTO.empty(request.getPageIndex(), request.getPageSize());
        }

        List<ExamSessionDto> examSessionDtoList = this.examSessionDao.search(request);
        var examSessionIds = examSessionDtoList.stream()
                .map(ExamSessionDto::getId)
                .toList();

        return PageDTO.of(this.getResponseByIds(examSessionIds), request.getPageIndex(), request.getPageSize(), count);
    }

    private List<ExamSessionResponse> getResponseByIds(List<Long> examSessionIds) {
        if (CollectionUtils.isEmpty(examSessionIds)) {
            return List.of();
        }
        return this.examSessionRepository.findByIds(examSessionIds).stream()
                .map(session -> buildExamSessionResponse(session, null))
                .toList();
    }

    @Transactional
    @Override
    public void delete(IdsRequest request) {
        List<ExamSession> examSessions = examSessionRepository.findByIds(request.getIds());

        Set<Long> idsSet = examSessions.stream().map(ExamSession::getId)
                .collect(Collectors.toSet());

        String idsNotFound = request.getIds().stream()
                .filter(i -> !idsSet.contains(i))
                .map(String::valueOf)
                .collect(Collectors.joining(", "));

        if (StringUtils.isNotEmpty(idsNotFound)) {
            throw new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND, idsNotFound);
        }

        examSessionRepository.softDeleteByIds(request.getIds());
    }

    @Override
    public ExamSessionResponse getById(Long id) {
        ExamSession examSession = examSessionRepository.findById(id)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        return buildExamSessionResponse(examSession, null);
    }

    @Override
    public int count(ExamSessionFilterRequest request) {
        return this.examSessionDao.count(request).intValue();
    }

    private void validateWindow(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && !end.isAfter(start)) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_TIME_WINDOW_INVALID, start, end);
        }
    }

    private void validateSettings(ExamSessionRequest request) {
        var settings = request.getSettings();
        if (settings == null) return;

        var proctoring = settings.getProctoring();
        if (proctoring != null) {

            if (Boolean.TRUE.equals(proctoring.getRequireIdUpload())) {
                if (proctoring.getIdentityMode() != ExamSessionSetting.IdentityMode.UPLOAD) {
                    throw new ResponseException(BadRequestError.ID_UPLOAD_REQUIRES_UPLOAD_MODE);
                }
            }

            if (proctoring.getIdentityMode() == ExamSessionSetting.IdentityMode.WEBCAM &&
                    !Boolean.TRUE.equals(proctoring.getMonitorEnabled())) {
                throw new ResponseException(BadRequestError.WEBCAM_MODE_REQUIRES_MONITORING);
            }

            if (proctoring.getIdentityMode() == ExamSessionSetting.IdentityMode.NONE &&
                    Boolean.TRUE.equals(proctoring.getMonitorEnabled())) {
                throw new ResponseException(BadRequestError.NONE_MODE_CANNOT_ENABLE_MONITORING);
            }
        }
    }

    private void validateAccessRequirements(ExamSession.AccessMode accessMode,
                                            ExamSessionRequest request,
                                            ExamSession existingSession) {
        if (accessMode == ExamSession.AccessMode.PRIVATE) {
            if (CollectionUtils.isEmpty(request.getStudentIds())) {
                throw new ResponseException(BadRequestError.STUDENT_IDS_REQUIRED);
            }
        }
    }

    private List<SessionStudent> synchronizeSessionStudents(ExamSession session, ExamSessionRequest request) {
        if (session.getId() == 0) {
            return Collections.emptyList();
        }

        if (session.getAccessMode() != ExamSession.AccessMode.PRIVATE) {
            List<SessionStudent> existingStudents = sessionStudentRepository.findByExamSessionId(session.getId());
            if (CollectionUtils.isNotEmpty(existingStudents)) {
                deleteStudentAvatars(existingStudents);
                sessionStudentRepository.deleteAll(existingStudents);

                entityManager.flush();
                entityManager.clear();
            }
            return Collections.emptyList();
        }

        List<UUID> studentIds = request.getStudentIds();
        if (CollectionUtils.isEmpty(studentIds)) {
            throw new ResponseException(BadRequestError.STUDENT_IDS_REQUIRED);
        }

        List<SessionStudent> existingStudents = sessionStudentRepository.findByExamSessionId(session.getId());

        Map<UUID, List<SessionStudent>> groupedByUserId = existingStudents.stream()
                .collect(Collectors.groupingBy(ss -> ss.getUser().getId()));

        List<SessionStudent> duplicatesToDelete = new ArrayList<>();
        Map<UUID, SessionStudent> existingByUserId = new java.util.HashMap<>();

        for (Map.Entry<UUID, List<SessionStudent>> entry : groupedByUserId.entrySet()) {
            List<SessionStudent> students = entry.getValue();
            if (students.size() > 1) {
                students.sort((s1, s2) -> {
                    if (s1.getCreatedAt() != null && s2.getCreatedAt() != null) {
                        return s2.getCreatedAt().compareTo(s1.getCreatedAt());
                    }
                    return 0;
                });
                existingByUserId.put(entry.getKey(), students.get(0));
                duplicatesToDelete.addAll(students.subList(1, students.size()));
            } else {
                existingByUserId.put(entry.getKey(), students.get(0));
            }
        }

        if (!duplicatesToDelete.isEmpty()) {
            
            deleteStudentAvatars(duplicatesToDelete);
            sessionStudentRepository.deleteAll(duplicatesToDelete);
            Set<Long> duplicateIds = duplicatesToDelete.stream()
                    .map(SessionStudent::getId)
                    .collect(Collectors.toSet());
            existingStudents = existingStudents.stream()
                    .filter(ss -> !duplicateIds.contains(ss.getId()))
                    .toList();
        }

        List<User> students = userRepository.findStudentsByIds(studentIds);
        if (students.size() != studentIds.size()) {
            throw new ResponseException(BadRequestError.USER_NOT_STUDENT);
        }

        Map<UUID, List<String>> studentAvatars = request.getStudentAvatars();
        if (studentAvatars == null) {
            studentAvatars = Collections.emptyMap();
        }

        List<SessionStudent> results = new ArrayList<>();
        for (User student : students) {
            SessionStudent existing = existingByUserId.get(student.getId());
            List<String> newAvatarBase64List = studentAvatars.get(student.getId());
            List<String> avatarUrls;

            if (newAvatarBase64List != null && !newAvatarBase64List.isEmpty()) {
                avatarUrls = uploadAvatarsToS3(session.getId(), student.getId(), newAvatarBase64List);
                
                if (existing != null && CollectionUtils.isNotEmpty(existing.getAvatarUrls())) {
                    deleteAvatarUrls(existing.getAvatarUrls());
                }
            } else if (existing != null) {
                avatarUrls = existing.getAvatarUrls() != null ? existing.getAvatarUrls() : Collections.emptyList();
            } else {
                avatarUrls = Collections.emptyList();
            }
            
            if (existing != null) {
                existing.setExamSession(session);
                existing.setUser(student);
                existing.setAvatarUrls(avatarUrls);
                results.add(existing);
                log.debug("Updating existing SessionStudent (ID: {}) for student: {}", 
                    existing.getId(), student.getEmail());
            } else {
                results.add(SessionStudent.builder()
                        .examSession(session)
                        .user(student)
                        .avatarUrls(avatarUrls)
                        .build());
                log.debug("Creating new SessionStudent for student: {}", student.getEmail());
            }
        }

        // Remove students no longer in the list
        Set<UUID> newUserIds = results.stream()
                .map(ss -> ss.getUser().getId())
                .collect(Collectors.toSet());
        
        List<SessionStudent> removedStudents = existingStudents.stream()
                .filter(ss -> !newUserIds.contains(ss.getUser().getId()))
                .collect(Collectors.toList());

        if (CollectionUtils.isNotEmpty(removedStudents)) {
            log.info("Removing {} students no longer in session {}", removedStudents.size(), session.getId());
            deleteStudentAvatars(removedStudents);
            sessionStudentRepository.deleteAll(removedStudents);
        }

        entityManager.flush();
        entityManager.clear();

        if (results.isEmpty()) {
            return Collections.emptyList();
        }

        return sessionStudentRepository.saveAll(results);
    }

    private List<SessionStudent> createStudentsFromImport(ExamSession session,
                                                           List<StudentImportEntry> importEntries,
                                                           Map<UUID, SessionStudent> existingByUserId) {
        if (CollectionUtils.isEmpty(importEntries)) {
            throw new ResponseException(BadRequestError.PRIVATE_CONFIG_REQUIRED);
        }

        List<String> emails = importEntries.stream()
                .map(StudentImportEntry::getEmail)
                .filter(StringUtils::isNotBlank)
                .map(email -> email.trim().toLowerCase())
                .distinct()
                .collect(Collectors.toList());

        if (emails.isEmpty()) {
            throw new ResponseException(BadRequestError.STUDENT_IDS_REQUIRED);
        }

        for (String email : emails) {
            if (!EmailUtils.isValidEmail(email)) {
                throw new ResponseException(BadRequestError.INVALID_EMAIL_FORMAT);
            }
        }

        List<User> students = userRepository.findStudentsByEmails(emails);
        if (students.size() != emails.size()) {
            throw new ResponseException(BadRequestError.USER_NOT_STUDENT);
        }

        Map<String, User> userByEmail = students.stream()
                .collect(Collectors.toMap(
                        user -> user.getEmail().toLowerCase(),
                        user -> user
                ));

        List<SessionStudent> results = new ArrayList<>();
        for (StudentImportEntry entry : importEntries) {
            String email = entry.getEmail().trim().toLowerCase();
            User student = userByEmail.get(email);
            if (student == null) {
                continue;
            }

            SessionStudent existing = existingByUserId.get(student.getId());
            List<String> avatarUrls;

            if (CollectionUtils.isNotEmpty(entry.getAvatarImages())) {
                avatarUrls = uploadStudentAvatars(session.getId(), email, entry.getAvatarImages());
            }
            else if (existing != null && CollectionUtils.isNotEmpty(existing.getAvatarUrls())) {
                avatarUrls = new ArrayList<>(existing.getAvatarUrls());
                log.debug("Reusing {} avatar URLs for student: {}", avatarUrls.size(), email);
            }
            else {
                avatarUrls = Collections.emptyList();
            }

            results.add(SessionStudent.builder()
                    .examSession(session)
                    .user(student)
                    .avatarUrls(avatarUrls)
                    .build());
        }

        return results;
    }


    private List<String> uploadStudentAvatarsIfChanged(Long sessionId,
                                                        String normalizedEmail,
                                                        List<String> newAvatarImages,
                                                        List<String> existingUrls) {
        if (CollectionUtils.isEmpty(newAvatarImages)) {
            return Collections.emptyList();
        }

        List<String> resultUrls = new ArrayList<>();
        int uploadIndex = 0;

        Set<String> existingUrlSet = new HashSet<>(existingUrls != null ? existingUrls : Collections.emptyList());

        for (String avatar : newAvatarImages) {
            if (StringUtils.isBlank(avatar)) {
                continue;
            }

            if ((avatar.startsWith("http://") || avatar.startsWith("https://")) && existingUrlSet.contains(avatar)) {
                resultUrls.add(avatar);
                log.debug("Keeping existing URL for student {}: {}", normalizedEmail, avatar);
                continue;
            }

            if (avatar.startsWith("blob:")) {
                log.warn("Found blob URL in avatar list for student {}, skipping", normalizedEmail);
                continue;
            }

            if (resultUrls.size() >= 5) {
                break;
            }

            String sanitizedEmail = normalizedEmail.replace("@", "_at_").replace(".", "_");
            String key = String.format("session-students/%d/%s/%d", sessionId, sanitizedEmail, ++uploadIndex);

            try {
                String base64Data = avatar;
                if (avatar.startsWith("data:")) {
                    int commaIndex = avatar.indexOf(',');
                    if (commaIndex > 0) {
                        base64Data = avatar.substring(commaIndex + 1);
                    }
                }

                String url = s3Service.uploadFromBase64(base64Data, key);
                resultUrls.add(url);
                log.debug("Uploaded new avatar for student {}: {}", normalizedEmail, url);
            } catch (IOException e) {
                log.error("Failed to upload student avatar for {}", normalizedEmail, e);
                throw new ResponseException(BadRequestError.FILE_UPLOAD_FAILED);
            }
        }

        return resultUrls;
    }

    private List<String> uploadStudentAvatars(Long sessionId,
                                               String normalizedEmail,
                                               List<String> avatarImages) {
        if (CollectionUtils.isEmpty(avatarImages)) {
            return Collections.emptyList();
        }

        List<String> uploadedUrls = new ArrayList<>();
        int index = 0;

        for (String avatar : avatarImages) {
            if (StringUtils.isBlank(avatar)) {
                continue;
            }

            if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("blob:")) {
                uploadedUrls.add(avatar);
                continue;
            }

            if (uploadedUrls.size() >= 5) {
                break;
            }

            String sanitizedEmail = normalizedEmail.replace("@", "_at_").replace(".", "_");
            String key = String.format("session-students/%d/%s/%d", sessionId, sanitizedEmail, ++index);

            try {
                String base64Data = avatar;
                if (avatar.startsWith("data:")) {
                    int commaIndex = avatar.indexOf(',');
                    if (commaIndex > 0) {
                        base64Data = avatar.substring(commaIndex + 1);
                    }
                }

                String url = s3Service.uploadFromBase64(base64Data, key);
                uploadedUrls.add(url);
            } catch (IOException e) {
                log.error("Failed to upload student avatar for {}", normalizedEmail, e);
                throw new ResponseException(BadRequestError.FILE_UPLOAD_FAILED);
            }
        }

        return uploadedUrls;
    }

    private List<String> uploadAvatarsToS3(Long sessionId, UUID userId, List<String> base64List) {
        List<String> uploadedUrls = new ArrayList<>();
        int index = 0;

        for (String base64 : base64List) {
            if (StringUtils.isBlank(base64)) {
                continue;
            }

            if (uploadedUrls.size() >= 5) {
                break;
            }

            // Skip if it's already an S3 URL (existing avatar)
            if (base64.startsWith("http://") || base64.startsWith("https://")) {
                uploadedUrls.add(base64);
                continue;
            }

            String key = String.format("session-students/%d/%s/%d", sessionId, userId.toString(), ++index);

            try {
                String preview = base64.length() > 100 ? base64.substring(0, 100) + "..." : base64;
                
                String base64Data = base64;
                
                if (base64.startsWith("data:")) {
                    int commaIndex = base64.indexOf(',');
                    if (commaIndex > 0) {
                        base64Data = base64.substring(commaIndex + 1);
                    } else {
                        continue;
                    }
                }

                base64Data = base64Data.replaceAll("\\s+", "");
                
                if (!base64Data.matches("^[A-Za-z0-9+/]+=*$")) {
                    log.error("Invalid base64 format after cleaning. First 50 chars: {}", 
                        base64Data.substring(0, Math.min(50, base64Data.length())));
                    continue;
                }

                String url = s3Service.uploadFromBase64(base64Data, key);
                uploadedUrls.add(url);
            } catch (IOException e) {
                throw new ResponseException(BadRequestError.FILE_UPLOAD_FAILED);
            }
        }

        return uploadedUrls;
    }

    private void deleteAvatarUrls(List<String> avatarUrls) {
        if (CollectionUtils.isEmpty(avatarUrls)) {
            return;
        }

        for (String url : avatarUrls) {
            if (StringUtils.isNotBlank(url) && url.startsWith("http")) {
                try {
                    s3Service.deleteFile(url);
                    log.debug("Deleted avatar: {}", url);
                } catch (Exception ex) {
                    log.warn("Failed to delete avatar {}", url, ex);
                }
            }
        }
    }

    private void deleteStudentAvatars(List<SessionStudent> students) {
        if (CollectionUtils.isEmpty(students)) {
            return;
        }

        for (SessionStudent student : students) {
            List<String> avatarUrls = student.getAvatarUrls();
            if (CollectionUtils.isNotEmpty(avatarUrls)) {
                for (String url : avatarUrls) {
                    if (StringUtils.isNotBlank(url) && url.startsWith("http")) {
                        try {
                            s3Service.deleteFile(url);
                        } catch (Exception ex) {
                            log.warn("Failed to delete student avatar {}", url, ex);
                        }
                    }
                }
            }
        }
    }

    private ExamSessionResponse buildExamSessionResponse(ExamSession session, List<SessionStudent> persistedStudents) {
        ExamSessionResponse response = examSessionMapper.toExamSessionResponse(session);
        response.setAccessMode(session.getAccessMode());

        List<SessionStudent> studentList = persistedStudents;
        if (studentList == null && session.getId() != 0) {
            studentList = sessionStudentRepository.findByExamSessionId(session.getId());
        }

        if (CollectionUtils.isEmpty(studentList)) {
            response.setAssignedStudents(Collections.emptyList());
        } else {
            List<SessionStudentEntryResponse> entries = studentList.stream()
                    .map(this::toSessionStudentResponse)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            
            response.setAssignedStudents(entries);
        }

        return response;
    }

    private SessionStudentEntryResponse toSessionStudentResponse(SessionStudent student) {
        if (student == null || student.getUser() == null) {
            return null;
        }

        List<String> avatarUrls = student.getAvatarUrls();
        List<String> sanitized = CollectionUtils.isEmpty(avatarUrls)
                ? Collections.emptyList()
                : new ArrayList<>(avatarUrls);

        return SessionStudentEntryResponse.builder()
                .userId(student.getUser().getId())
                .email(student.getUser().getEmail())
                .fullName(student.getUser().getInformation().buildFullName())
                .avatarImages(sanitized)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SessionStatsResponse getSessionStats(Long id) {
        ExamSession session = examSessionRepository.findById(id)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND, id));

        List<ExamAttempt> attempts = examAttemptRepository.findByExamSessionId(id);
        long uniqueStudents = attempts.stream()
                .map(ExamAttempt::getStudentEmail)
                .distinct()
                .count();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String startDate = session.getStartTime() != null ? session.getStartTime().format(formatter) : "N/A";
        String endDate = session.getEndTime() != null ? session.getEndTime().format(formatter) : "N/A";

        return SessionStatsResponse.builder()
                .code(session.getCode())
                .startDate(startDate)
                .endDate(endDate)
                .totalStudents((int) uniqueStudents)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageDTO<SessionUserResponse> getSessionUsers(Long id, SessionUserFilterRequest request) {
        examSessionRepository.findById(id)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND, id));

        List<ExamAttempt> attempts = examAttemptRepository.findByExamSessionId(id);

        Map<String, List<ExamAttempt>> studentAttempts = attempts.stream()
                .collect(Collectors.groupingBy(ExamAttempt::getStudentEmail));

        List<SessionUserResponse> users = studentAttempts.entrySet().stream()
                .map(entry -> {
                    String email = entry.getKey();
                    List<ExamAttempt> userAttempts = entry.getValue();
                    ExamAttempt latestAttempt = userAttempts.get(0);

                    return SessionUserResponse.builder()
                            .id(latestAttempt.getId())
                            .name(latestAttempt.getStudentName())
                            .role("Học viên")
                            .email(email)
                            .code(latestAttempt.getStudentName())
                            .gender("Không rõ")
                            .status("Hoạt động")
                            .build();
                })
                .toList();

        List<SessionUserResponse> filteredUsers = users.stream()
                .filter(user -> {
                    if (StringUtils.isNotBlank(request.getSearchText())) {
                        String search = request.getSearchText().toLowerCase();
                        return user.getName().toLowerCase().contains(search) ||
                                user.getEmail().toLowerCase().contains(search) ||
                                user.getCode().toLowerCase().contains(search);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        int total = filteredUsers.size();
        int pageIndex = request.getPageIndex();
        int pageSize = request.getPageSize();
        int start = pageIndex * pageSize;
        int end = Math.min(start + pageSize, total);

        List<SessionUserResponse> paginatedUsers = start < total
                ? filteredUsers.subList(start, end)
                : new ArrayList<>();

        return PageDTO.of(paginatedUsers, pageIndex, pageSize, (long) total);
    }
}
