package com.datn.exam.service.impl;

import com.datn.exam.model.dto.ExamSessionSetting;
import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.mapper.ExamSessionMapper;
import com.datn.exam.model.dto.mapper.ExamSessionSettingsMapper;
import com.datn.exam.model.dto.request.ExamSessionFilterRequest;
import com.datn.exam.model.dto.request.ExamSessionRequest;
import com.datn.exam.model.dto.request.IdsRequest;
import com.datn.exam.model.dto.response.ExamSessionResponse;
import com.datn.exam.model.entity.Exam;
import com.datn.exam.model.entity.ExamSession;
import com.datn.exam.repository.ExamRepository;
import com.datn.exam.repository.ExamSessionRepository;
import com.datn.exam.repository.data.dao.ExamSessionDao;
import com.datn.exam.repository.data.dto.ExamDto;
import com.datn.exam.repository.data.dto.ExamSessionDto;
import com.datn.exam.service.ExamSessionService;
import com.datn.exam.support.enums.error.AuthorizationError;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.InviteCodeUtils;
import com.datn.exam.support.util.JsonUtils;
import com.datn.exam.support.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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

    @Transactional
    @Override
    public ExamSessionResponse create(ExamSessionRequest request) {
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_NOT_FOUND));

        this.validateWindow(request.getStartTime(), request.getEndTime());
        this.validateSettings(request);

        String code = InviteCodeUtils.generate();
        while (examSessionRepository.existsByCode(code)) code = InviteCodeUtils.generate();

        String token = InviteCodeUtils.nextJoinToken();
        while (examSessionRepository.existsByJoinToken(token)) token = InviteCodeUtils.nextJoinToken();

        Map<String, Object> settingsMap = JsonUtils.toMap(request.getSettings());

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
                .isPublic(request.isPublic())
                .attemptLimit(request.getAttemptLimit())
                .settings(settingsMap)
                .deleted(Boolean.FALSE)
                .build();

        examSessionRepository.save(session);

        return examSessionMapper.toExamSessionResponse(session);
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

        String code = examSession.getCode();
        String joinToken = examSession.getJoinToken();

        examSessionMapper.updateExamSession(examSession, request);
        examSession.setExam(exam);
        examSession.setCode(code);
        examSession.setJoinToken(joinToken);

        examSessionRepository.save(examSession);

        return examSessionMapper.toExamSessionResponse(examSession);
    }


    @Override
    public PageDTO<ExamSessionDto> filter(ExamSessionFilterRequest request) {
        Long count = this.examSessionDao.count(request);

        if (Objects.equals(count, 0L)) {
            return PageDTO.empty(request.getPageIndex(), request.getPageSize());
        }

        List<ExamSessionDto> examSessionDtoList = this.examSessionDao.search(request);

        return PageDTO.of(examSessionDtoList, request.getPageIndex(), request.getPageSize(), count);
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

        return examSessionMapper.toExamSessionResponse(examSession);
    }

    private void validateWindow(Instant start, Instant end) {
        if (start != null && end != null && !end.isAfter(start)) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_TIME_WINDOW_INVALID, start, end);
        }
    }

    private void validateSettings(ExamSessionRequest request) {
        var settings = request.getSettings();
        if (settings == null) return;

        var proctoring = settings.getProctoring();
        if (proctoring != null) {

            //Nếu requireIdUpload = true → bắt buộc phải dùng UPLOAD mode
            if (Boolean.TRUE.equals(proctoring.getRequireIdUpload())) {
                if (proctoring.getIdentityMode() != ExamSessionSetting.IdentityMode.UPLOAD) {
                    throw new ResponseException(BadRequestError.ID_UPLOAD_REQUIRES_UPLOAD_MODE);
                }
            }

            //Nếu identityMode = WEBCAM → bắt buộc phải bật giám sát
            if (proctoring.getIdentityMode() == ExamSessionSetting.IdentityMode.WEBCAM &&
                    !Boolean.TRUE.equals(proctoring.getMonitorEnabled())) {
                throw new ResponseException(BadRequestError.WEBCAM_MODE_REQUIRES_MONITORING);
            }

            //Nếu identityMode = NONE nhưng lại yêu cầu giám sát → sai
            if (proctoring.getIdentityMode() == ExamSessionSetting.IdentityMode.NONE &&
                    Boolean.TRUE.equals(proctoring.getMonitorEnabled())) {
                throw new ResponseException(BadRequestError.NONE_MODE_CANNOT_ENABLE_MONITORING);
            }
        }
    }
}
