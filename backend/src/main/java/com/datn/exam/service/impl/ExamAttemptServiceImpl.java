package com.datn.exam.service.impl;

import com.datn.exam.model.dto.mapper.AnswerPayloadMapper;
import com.datn.exam.model.dto.request.ManualGradingRequest;
import com.datn.exam.model.dto.request.StartAttemptRequest;
import com.datn.exam.model.dto.request.SubmitAttemptRequest;
import com.datn.exam.model.dto.response.AttemptDetailResponse;
import com.datn.exam.model.dto.response.AttemptGradingResponse;
import com.datn.exam.model.dto.response.AttemptListResponse;
import com.datn.exam.model.dto.response.GuestAccess;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.model.entity.*;
import com.datn.exam.repository.*;
import com.datn.exam.service.AutoGradingService;
import com.datn.exam.service.ExamAttemptService;
import com.datn.exam.service.ExamJoinService;
import com.datn.exam.service.MailPersistenceService;
import com.datn.exam.service.validation.SubmitAttemptValidator;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.error.AuthorizationError;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.DomainValidationException;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamAttemptServiceImpl implements ExamAttemptService {
    private final ExamSessionRepository examSessionRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final ExamAttemptQuestionRepository examAttemptQuestionRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final UserRepository userRepository;
    private final AnswerPayloadMapper answerPayloadMapper;
    private final AutoGradingService autoGradingService;
    private final SubmitAttemptValidator submitAttemptValidator;
    private final ExamJoinService examJoinService;
    private final MailPersistenceService mailPersistenceService;

    @Override
    @Transactional
    public AttemptDetailResponse startAttempt(StartAttemptRequest request) {
        GuestAccess guestAccess = examJoinService.validateSessionToken(request.getSessionToken());

        if (!guestAccess.getSessionId().equals(request.getSessionId())) {
            throw new ResponseException(BadRequestError.SESSION_TOKEN_MISMATCH);
        }

        String studentEmail = guestAccess.getEmail();
        String studentName = request.getName();

        ExamSession examSession = examSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        this.validateSessionForStart(examSession);

        var existingAttempt = examAttemptRepository
                .findByExamSessionIdAndStudentEmailAndStatus(
                        examSession.getId(),
                        studentEmail,
                        ExamAttempt.AttemptStatus.IN_PROGRESS
                );

        if (CollectionUtils.isNotEmpty(existingAttempt)) {
            return buildAttemptDetailResponse(existingAttempt.get(0), examSession.getDurationMinutes());
        }

        int usedAttempts = examAttemptRepository.countByExamSessionIdAndStudentEmail(examSession.getId(), studentEmail);
        if (usedAttempts >= examSession.getAttemptLimit()) {
            throw new ResponseException(BadRequestError.ATTEMPT_LIMIT_REACHED);
        }

        int attemptNoMax = examAttemptRepository.findMaxAttemptNoByEmail(examSession.getId(), studentEmail);
        int nextAttemptNo = attemptNoMax + 1;

        LocalDateTime startedAt = LocalDateTime.now();
        ExamAttempt attempt = ExamAttempt.builder()
                .examSession(examSession)
                .studentEmail(studentEmail)
                .studentName(studentName)
                .attemptNo(nextAttemptNo)
                .startedAt(startedAt)
                .status(ExamAttempt.AttemptStatus.IN_PROGRESS)
                .gradingStatus(ExamAttempt.GradingStatus.PENDING)
                .scoreAuto(BigDecimal.ZERO)
                .scoreManual(BigDecimal.ZERO)
                .fullscreenExitCount(0)
                .build();

        List<ExamQuestion> examQuestions = examQuestionRepository.findByExamIdWithQuestionAndAnswers(examSession.getExam().getId());

        if (examQuestions.isEmpty()) {
            throw new ResponseException(BadRequestError.EXAM_HAS_NO_QUESTIONS);
        }

        List<ExamQuestion> orderedQuestions = shuffleQuestions(examQuestions, examSession.isShuffleQuestions());

        for (int i = 0; i < orderedQuestions.size(); i++) {
            ExamQuestion examQuestion = orderedQuestions.get(i);
            Question question = examQuestion.getQuestion();

            Map<String, Object> snapshot = this.buildQuestionSnapshot(question, examQuestion.getPoint(), examSession.isShuffleAnswers());

            ExamAttemptQuestion examAttemptQuestion = ExamAttemptQuestion.builder()
                    .examQuestionId(examQuestion.getId())
                    .questionId(question.getId())
                    .orderIndex(i)
                    .type(question.getQuestionValue().getType())
                    .point(examQuestion.getPoint())
                    .questionSnapshot(snapshot)
                    .autoScore(BigDecimal.ZERO)
                    .manualScore(BigDecimal.ZERO)
                    .correct(null)
                    .build();

            attempt.addAttemptQuestion(examAttemptQuestion);
        }

        examAttemptRepository.save(attempt);

        return buildAttemptDetailResponse(attempt, examSession.getDurationMinutes());
    }

    @Transactional
    @Override
    public AttemptDetailResponse submitAttempt(Long attemptId, SubmitAttemptRequest request, String sessionToken) {
        GuestAccess guestAccess = examJoinService.validateSessionToken(sessionToken);

        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_ATTEMPT_NOT_FOUND));

        if (!attempt.getStudentEmail().equalsIgnoreCase(guestAccess.getEmail())) {
            throw new ResponseException(AuthorizationError.ACCESS_DENIED);
        }

        if (attempt.getExamSession().getId() != guestAccess.getSessionId()) {
            throw new ResponseException(BadRequestError.SESSION_TOKEN_MISMATCH);
        }

        if (attempt.getStatus() != ExamAttempt.AttemptStatus.IN_PROGRESS) {
            throw new ResponseException(BadRequestError.ATTEMPT_ALREADY_SUBMITTED);
        }

        LocalDateTime submittedAt = LocalDateTime.now();
        LocalDateTime expireAt = attempt.getStartedAt()
                .plusSeconds((long) attempt.getExamSession().getDurationMinutes() * 60);

        if (submittedAt.isAfter(expireAt.plusSeconds(60))) {
            throw new ResponseException(BadRequestError.SUBMIT_AFTER_DEADLINE);
        }

        List<InvalidFieldError> errors = submitAttemptValidator.validate(request, attemptId);
        if (!errors.isEmpty()) {
            throw new DomainValidationException(errors);
        }

        Map<Long, SubmitAttemptRequest.AnswerSubmission> answerMap = request.getAnswers().stream()
                .collect(Collectors.toMap(
                        SubmitAttemptRequest.AnswerSubmission::getAttemptQuestionId,
                        a -> a,
                        (a1, a2) -> a1
                ));

        List<ExamAttemptQuestion> questions = attempt.getAttemptQuestions();
        BigDecimal totalAutoScore = BigDecimal.ZERO;

        for (ExamAttemptQuestion question : questions) {
            SubmitAttemptRequest.AnswerSubmission answerSubmission = answerMap.get(question.getId());

            Map<String, Object> payload = answerPayloadMapper.toPayload(answerSubmission, question.getType());

            if (payload != null && !payload.isEmpty()) {
                ExamAttemptAnswer answer = ExamAttemptAnswer.builder()
                        .attemptQuestion(question)
                        .payload(payload)
                        .build();

                question.setAnswer(answer);
            }

            BigDecimal autoScore = autoGradingService.grade(question, answerSubmission);
            question.setAutoScore(autoScore);
            totalAutoScore = totalAutoScore.add(autoScore);
        }

        attempt.setScoreAuto(totalAutoScore);
        attempt.setSubmittedAt(submittedAt);
        attempt.setStatus(Optional.ofNullable(request.getStatus()).orElse(ExamAttempt.AttemptStatus.SUBMITTED));
        // Tất cả bài thi sau khi submit đều ở trạng thái PENDING
        // Chỉ khi giáo viên chấm bằng tay (manualGrading) thì mới chuyển sang DONE
        attempt.setGradingStatus(ExamAttempt.GradingStatus.PENDING);

        log.info("Saving attempt {} with status SUBMITTED", attemptId);
        ExamAttempt savedAttempt = examAttemptRepository.save(attempt);
        examAttemptRepository.flush();
        log.info("Attempt {} saved and flushed. Status in DB: {}", attemptId, savedAttempt.getStatus());

        return this.buildAttemptDetailResponse(savedAttempt, savedAttempt.getExamSession().getDurationMinutes());
    }

    @Transactional(readOnly = true)
    @Override
    public AttemptDetailResponse getCurrentAttempt(Long sessionId, String sessionToken) {
        if (sessionToken == null || sessionToken.isBlank()) {
            throw new ResponseException(BadRequestError.SESSION_TOKEN_REQUIRED);
        }

        GuestAccess guestAccess = examJoinService.validateSessionToken(sessionToken);

        if (!guestAccess.getSessionId().equals(sessionId)) {
            throw new ResponseException(BadRequestError.SESSION_TOKEN_MISMATCH);
        }

        String studentEmail = guestAccess.getEmail();

        var attemptOpt = examAttemptRepository
                .findByExamSessionIdAndStudentEmailAndStatus(
                        sessionId,
                        studentEmail,
                        ExamAttempt.AttemptStatus.IN_PROGRESS
                );

        if (attemptOpt.isEmpty()) {
            throw new ResponseException(NotFoundError.NO_ACTIVE_ATTEMPT);
        }

        ExamAttempt attempt = attemptOpt.get(0);
        ExamSession session = attempt.getExamSession();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expireAt = attempt.getStartedAt()
                .plusSeconds((long) session.getDurationMinutes() * 60);

        if (now.isAfter(expireAt)) {
            autoSubmitExpiredAttempt(attempt);
            throw new ResponseException(BadRequestError.ATTEMPT_EXPIRED);
        }

        return buildAttemptDetailResponse(attempt, session.getDurationMinutes());
    }

    private void autoSubmitExpiredAttempt(ExamAttempt attempt) {
        attempt.setStatus(ExamAttempt.AttemptStatus.ABANDONED);
        attempt.setGradingStatus(ExamAttempt.GradingStatus.DONE);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setScoreAuto(BigDecimal.ZERO);
        attempt.setScoreManual(BigDecimal.ZERO);

        examAttemptRepository.save(attempt);
    }

    private void validateSessionForStart(ExamSession session) {
        if (Boolean.TRUE.equals(session.getDeleted())) {
            throw new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND);
        }

        if (session.getExamStatus() != ExamSession.ExamStatus.OPEN) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_CLOSED);
        }

        LocalDateTime now = LocalDateTime.now();
        if (session.getStartTime() != null && now.isBefore(session.getStartTime())) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_STARTED);
        }

        if (session.getEndTime() != null) {
            long lateJoinSeconds = (session.getLateJoinMinutes() != null ? session.getLateJoinMinutes() : 0) * 60L;
            LocalDateTime finalDeadline = session.getEndTime().plusSeconds(lateJoinSeconds);
            if (now.isAfter(finalDeadline)) {
                throw new ResponseException(BadRequestError.EXAM_SESSION_ENDED);
            }
        }
    }

    private List<ExamQuestion> shuffleQuestions(List<ExamQuestion> src, boolean shuffle) {
        if (!shuffle) return new ArrayList<>(src);

        List<ExamQuestion> copy = new ArrayList<>(src);
        ThreadLocalRandom rnd = ThreadLocalRandom.current();

        for (int i = copy.size() - 1; i > 0; i--) {
            int j = rnd.nextInt(i + 1);
            Collections.swap(copy, i, j);
        }

        return copy;
    }

    private Map<String, Object> buildQuestionSnapshot(Question question, BigDecimal point, boolean shuffleAnswers) {
        Map<String, Object> snapshot = new LinkedHashMap<>();

        snapshot.put("text", question.getText());
        snapshot.put("type", question.getQuestionValue().getType().name());
        snapshot.put("point", point);

        // Add questionValue for TABLE_CHOICE, PLAIN_TEXT, ESSAY
        if (question.getQuestionValue() != null) {
            snapshot.put("questionValue", serializeQuestionValue(question.getQuestionValue()));
        }

        if (question.getAnswers() != null && !question.getAnswers().isEmpty()) {
            List<Map<String, Object>> answerList = new ArrayList<>();

            for (Answer a : question.getAnswers()) {
                Map<String, Object> am = new LinkedHashMap<>();
                am.put("answerId", a.getId());
                am.put("value", a.getValue());
                am.put("result", a.getResult());
                am.put("orderIndex", a.getOrderIndex());
                answerList.add(am);
            }

            if (shuffleAnswers && question.getQuestionValue().getType() != QuestionType.TABLE_CHOICE) {
                Collections.shuffle(answerList, ThreadLocalRandom.current());
            }

            snapshot.put("answers", answerList);
        }

        return snapshot;
    }

    private Map<String, Object> serializeQuestionValue(Question.BaseQuestion qv) {
        Map<String, Object> map = new LinkedHashMap<>();

        if (qv instanceof Question.PlainTextQuestion ptq) {
            map.put("expectedAnswer", ptq.getExpectedAnswer());
            map.put("caseSensitive", ptq.getCaseSensitive());
            map.put("exactMatch", ptq.getExactMatch());
        } else if (qv instanceof Question.TableChoiceQuestion tcq) {
            map.put("headers", tcq.getHeaders());

            List<Map<String, Object>> rows = new ArrayList<>();
            for (Question.RowCompact row : tcq.getRows()) {
                Map<String, Object> rowMap = new LinkedHashMap<>();
                rowMap.put("label", row.getLabel());
                rowMap.put("correctIndex", row.getCorrectIndex());
                rows.add(rowMap);
            }
            map.put("rows", rows);
        } else if (qv instanceof Question.EssayQuestion eq) {
            map.put("minWords", eq.getMinWords());
            map.put("maxWords", eq.getMaxWords());
            map.put("sampleAnswer", eq.getSampleAnswer());
            map.put("gradingCriteria", eq.getGradingCriteria());
        }

        return map;
    }

    private AttemptDetailResponse buildAttemptDetailResponse(
            ExamAttempt attempt,
            Integer durationMinutes
    ) {
        List<ExamAttemptQuestion> questions = attempt.getAttemptQuestions();
        LocalDateTime expireAt = attempt.getStartedAt().plusSeconds((long) durationMinutes * 60);

        List<AttemptDetailResponse.QuestionResponse> questionResponses = questions.stream()
                .map(this::mapToQuestionResponse)
                .toList();

        ExamSession session = attempt.getExamSession();
        Map<String, Object> settings = session.getSettings() != null
                ? new HashMap<>(session.getSettings())
                : new HashMap<>();

        return AttemptDetailResponse.builder()
                .attemptId(attempt.getId())
                .sessionId(attempt.getExamSession().getId())
                .sessionName(attempt.getExamSession().getName())
                .examCode(attempt.getExamSession().getCode())
                .attemptNo(attempt.getAttemptNo())
                .status(attempt.getStatus())
                .gradingStatus(attempt.getGradingStatus())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .expireAt(expireAt)
                .scoreAuto(attempt.getScoreAuto())
                .scoreManual(attempt.getScoreManual())
                .questions(questionResponses)
                .settings(settings)
                .build();
    }

    @SuppressWarnings("unchecked")
    private AttemptDetailResponse.QuestionResponse mapToQuestionResponse(ExamAttemptQuestion q) {
        Map<String, Object> snapshot = q.getQuestionSnapshot();
        if (snapshot == null) {
            return null;
        }

        String text = (String) snapshot.get("text");
        BigDecimal point = q.getPoint();
        QuestionType type = q.getType();

        List<AttemptDetailResponse.AnswerResponse> answers = Optional.ofNullable(snapshot.get("answers"))
                .filter(List.class::isInstance)
                .map(obj -> ((List<?>) obj).stream()
                        .filter(Map.class::isInstance)
                        .map(item -> {
                            Map<String, Object> map = (Map<String, Object>) item;
                            Number answerIdNum = (Number) map.get("answerId");
                            return AttemptDetailResponse.AnswerResponse.builder()
                                    .answerId(answerIdNum != null ? answerIdNum.longValue() : null)
                                    .value((String) map.get("value"))
                                    .build();
                        })
                        .toList()
                )
                .orElse(null);

        Map<String, Object> qv = (Map<String, Object>) snapshot.get("questionValue");

        Integer minWords = null;
        Integer maxWords = null;
        List<AttemptDetailResponse.TableRow> rows = null;
        List<String> headers = null;

        if (qv != null) {
            switch (type) {
                case ESSAY -> {
                    Object minObj = qv.get("minWords");
                    Object maxObj = qv.get("maxWords");
                    minWords = (minObj instanceof Number) ? ((Number) minObj).intValue() : null;
                    maxWords = (maxObj instanceof Number) ? ((Number) maxObj).intValue() : null;
                }
                case TABLE_CHOICE -> {
                    // Lấy headers từ questionValue
                    Object headersObj = qv.get("headers");
                    if (headersObj instanceof List<?>) {
                        headers = ((List<?>) headersObj).stream()
                                .filter(String.class::isInstance)
                                .map(String.class::cast)
                                .toList();
                    }

                    Object rowsObj = qv.get("rows");
                    if (rowsObj instanceof List<?>) {
                        rows = ((List<?>) rowsObj).stream()
                                .filter(Map.class::isInstance)
                                .map(item -> {
                                    Map<String, Object> row = (Map<String, Object>) item;
                                    List<String> columns = null;
                                    Object cols = row.get("columns");
                                    if (cols instanceof List<?>) {
                                        columns = ((List<?>) cols).stream()
                                                .filter(String.class::isInstance)
                                                .map(String.class::cast)
                                                .toList();
                                    }
                                    return AttemptDetailResponse.TableRow.builder()
                                            .label((String) row.get("label"))
                                            .columns(columns)
                                            .build();
                                })
                                .toList();
                    }
                }
                default -> {
                }
            }
        }

        return AttemptDetailResponse.QuestionResponse.builder()
                .attemptQuestionId(q.getId())
                .orderIndex(q.getOrderIndex())
                .type(type)
                .point(point)
                .text(text)
                .answers(answers)
                .minWords(minWords)
                .maxWords(maxWords)
                .rows(rows)
                .headers(headers)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttemptListResponse> getAttemptBySession(Long sessionId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        // Check authorization: owner check needs to be converted UUID to Long
        // Assuming ownerId is stored as Long in DB, we need to convert
        // For now, skipping owner check or you need to handle UUID<->Long conversion

        List<ExamAttempt> attempts = examAttemptRepository.findByExamSessionIdOrderBySubmittedAtDesc(sessionId);

        return attempts.stream()
                .map(this::mapToAttemptListResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AttemptGradingResponse getAttemptForGrading(Long attemptId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_ATTEMPT_NOT_FOUND));

        ExamSession session = attempt.getExamSession();
        // Check authorization if needed

        // Allow grading for both SUBMITTED and ABANDONED (auto-submitted) attempts
        if (attempt.getStatus() != ExamAttempt.AttemptStatus.SUBMITTED
                && attempt.getStatus() != ExamAttempt.AttemptStatus.ABANDONED) {
            throw new ResponseException(BadRequestError.EXAM_ATTEMPT_NOT_SUBMITTED);
        }

        return buildAttemptGradingResponse(attempt);
    }

    @Override
    @Transactional
    public void manualGrading(Long attemptId, ManualGradingRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_ATTEMPT_NOT_FOUND));

        ExamSession session = attempt.getExamSession();
        // Check authorization if needed

        // Allow grading for both SUBMITTED and ABANDONED (auto-submitted) attempts
        if (attempt.getStatus() != ExamAttempt.AttemptStatus.SUBMITTED
                && attempt.getStatus() != ExamAttempt.AttemptStatus.ABANDONED) {
            throw new ResponseException(BadRequestError.EXAM_ATTEMPT_NOT_SUBMITTED);
        }

        Map<Long, ManualGradingRequest.QuestionGrading> gradingMap = request.getQuestions().stream()
                .collect(Collectors.toMap(
                        ManualGradingRequest.QuestionGrading::getAttemptQuestionId,
                        g -> g
                ));

        BigDecimal totalManualScore = BigDecimal.ZERO;

        for (ExamAttemptQuestion question : attempt.getAttemptQuestions()) {
            ManualGradingRequest.QuestionGrading grading = gradingMap.get(question.getId());
            if (grading != null) {
                BigDecimal score = grading.getScore();

                // Validate score không vượt quá điểm tối đa
                if (score.compareTo(question.getPoint()) > 0) {
                    throw new ResponseException(BadRequestError.INVALID_SCORE_VALUE);
                }

                if (score.compareTo(BigDecimal.ZERO) < 0) {
                    throw new ResponseException(BadRequestError.INVALID_SCORE_VALUE);
                }

                question.setManualScore(score);
                question.setFeedback(grading.getFeedback());
                totalManualScore = totalManualScore.add(score);
            }
        }

        attempt.setScoreManual(totalManualScore);
        attempt.setGradingStatus(ExamAttempt.GradingStatus.DONE);

        examAttemptRepository.save(attempt);
    }

    @Override
    @Transactional
    public void incrementFullscreenExitCount(Long attemptId) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_ATTEMPT_NOT_FOUND));

        if (attempt.getFullscreenExitCount() == null) {
            attempt.setFullscreenExitCount(0);
        }

        attempt.setFullscreenExitCount(attempt.getFullscreenExitCount() + 1);
        examAttemptRepository.save(attempt);

        log.info("Incremented fullscreen exit count for attempt {}: {}", attemptId, attempt.getFullscreenExitCount());
    }

    private AttemptListResponse mapToAttemptListResponse(ExamAttempt attempt) {
        List<ExamAttemptQuestion> questions = attempt.getAttemptQuestions();
        int totalQuestions = questions.size();
        int correctAnswers = (int) questions.stream().filter(q -> Boolean.TRUE.equals(q.getCorrect())).count();
        int wrongAnswers = (int) questions.stream().filter(q -> Boolean.FALSE.equals(q.getCorrect())).count();
        int unanswered = totalQuestions - correctAnswers - wrongAnswers;

        BigDecimal finalScore = attempt.getScoreManual() != null && attempt.getScoreManual().compareTo(BigDecimal.ZERO) > 0
                ? attempt.getScoreManual()
                : attempt.getScoreAuto();

        return AttemptListResponse.builder()
                .attemptId(attempt.getId())
                .studentEmail(attempt.getStudentEmail())
                .studentName(attempt.getStudentName())
                .attemptNo(attempt.getAttemptNo())
                .status(attempt.getStatus())
                .gradingStatus(attempt.getGradingStatus())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .scoreAuto(attempt.getScoreAuto())
                .scoreManual(attempt.getScoreManual())
                .totalScore(finalScore)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctAnswers)
                .wrongAnswers(wrongAnswers)
                .unansweredQuestions(unanswered)
                .build();
    }

    @SuppressWarnings("unchecked")
    private AttemptGradingResponse buildAttemptGradingResponse(ExamAttempt attempt) {
        ExamSession session = attempt.getExamSession();

        BigDecimal totalScore = BigDecimal.ZERO;
        for (ExamAttemptQuestion q : attempt.getAttemptQuestions()) {
            if (q.getPoint() != null) {
                totalScore = totalScore.add(q.getPoint());
            }
        }

        List<AttemptGradingResponse.QuestionGradingDetail> questionDetails = attempt.getAttemptQuestions().stream()
                .map(this::mapToQuestionGradingDetail)
                .collect(Collectors.toList());

        return AttemptGradingResponse.builder()
                .attemptId(attempt.getId())
                .sessionId(session.getId())
                .sessionName(session.getName())
                .studentEmail(attempt.getStudentEmail())
                .studentName(attempt.getStudentName())
                .attemptNo(attempt.getAttemptNo())
                .status(attempt.getStatus())
                .gradingStatus(attempt.getGradingStatus())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .scoreAuto(attempt.getScoreAuto())
                .scoreManual(attempt.getScoreManual())
                .totalScore(totalScore)
                .questions(questionDetails)
                .build();
    }

    @SuppressWarnings("unchecked")
    private AttemptGradingResponse.QuestionGradingDetail mapToQuestionGradingDetail(ExamAttemptQuestion q) {
        Map<String, Object> snapshot = q.getQuestionSnapshot();
        QuestionType type = q.getType();

        String text = (String) snapshot.get("text");

        Map<String, Object> studentAnswer = null;
        if (q.getAnswer() != null && q.getAnswer().getPayload() != null) {
            studentAnswer = q.getAnswer().getPayload();
        }

        AttemptGradingResponse.QuestionGradingDetail.QuestionGradingDetailBuilder builder =
                AttemptGradingResponse.QuestionGradingDetail.builder()
                        .attemptQuestionId(q.getId())
                        .questionId(q.getQuestionId())
                        .orderIndex(q.getOrderIndex())
                        .type(type)
                        .point(q.getPoint())
                        .text(text)
                        .questionSnapshot(snapshot)
                        .studentAnswer(studentAnswer)
                        .autoScore(q.getAutoScore())
                        .manualScore(q.getManualScore())
                        .correct(q.getCorrect());

        // For ONE_CHOICE, MULTI_CHOICE, TRUE_FALSE: answers are directly in snapshot
        switch (type) {
            case ONE_CHOICE, MULTI_CHOICE, TRUE_FALSE -> {
                List<AttemptGradingResponse.AnswerDetail> answerDetails = buildAnswerDetails(snapshot, studentAnswer);
                builder.answers(answerDetails);
            }
            case TABLE_CHOICE -> {
                // For TABLE_CHOICE, we need questionValue from snapshot
                Map<String, Object> qv = (Map<String, Object>) snapshot.get("questionValue");
                if (qv != null) {
                    Object headersObj = qv.get("headers");
                    if (headersObj instanceof List<?>) {
                        List<String> headers = ((List<?>) headersObj).stream()
                                .filter(String.class::isInstance)
                                .map(String.class::cast)
                                .toList();
                        builder.tableHeaders(headers);
                    }

                    Object rowsObj = qv.get("rows");
                    if (rowsObj instanceof List<?>) {
                        List<AttemptGradingResponse.TableRowDetail> rowDetails = buildTableRowDetails(
                                (List<?>) rowsObj,
                                studentAnswer
                        );
                        builder.rows(rowDetails);
                    }
                }
            }
            case PLAIN_TEXT -> {
                Map<String, Object> qv = (Map<String, Object>) snapshot.get("questionValue");
                if (qv != null) {
                    String expected = (String) qv.get("expectedAnswer");
                    builder.expectedAnswer(expected);
                }
            }
            case ESSAY -> {
                Map<String, Object> qv = (Map<String, Object>) snapshot.get("questionValue");
                if (qv != null) {
                    Object minObj = qv.get("minWords");
                    Object maxObj = qv.get("maxWords");
                    Integer minWords = (minObj instanceof Number) ? ((Number) minObj).intValue() : null;
                    Integer maxWords = (maxObj instanceof Number) ? ((Number) maxObj).intValue() : null;
                    builder.minWords(minWords).maxWords(maxWords);

                    // Lấy sampleAnswer và gradingCriteria từ questionValue
                    String sampleAnswer = (String) qv.get("sampleAnswer");
                    String gradingCriteria = (String) qv.get("gradingCriteria");
                    builder.sampleAnswer(sampleAnswer).gradingCriteria(gradingCriteria);
                }
            }
        }

        return builder.build();
    }

    private List<AttemptGradingResponse.AnswerDetail> buildAnswerDetails(
            Map<String, Object> snapshot,
            Map<String, Object> studentAnswer
    ) {
        List<AttemptGradingResponse.AnswerDetail> details = new ArrayList<>();

        Object answersObj = snapshot.get("answers");
        if (!(answersObj instanceof List<?>)) {
            return details;
        }

        Set<Long> selectedIds = new HashSet<>();
        if (studentAnswer != null) {
            Object selectedObj = studentAnswer.get("selectedAnswerId");
            if (selectedObj instanceof Number) {
                selectedIds.add(((Number) selectedObj).longValue());
            }

            Object selectedIdsObj = studentAnswer.get("selectedAnswerIds");
            if (selectedIdsObj instanceof List<?>) {
                ((List<?>) selectedIdsObj).stream()
                        .filter(Number.class::isInstance)
                        .map(n -> ((Number) n).longValue())
                        .forEach(selectedIds::add);
            }
        }

        for (Object item : (List<?>) answersObj) {
            if (!(item instanceof Map<?, ?>)) {
                continue;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> answerMap = (Map<String, Object>) item;
            Object answerIdObj = answerMap.get("answerId");
            Long answerId = (answerIdObj instanceof Number) ? ((Number) answerIdObj).longValue() : null;
            String value = (String) answerMap.get("value");
            Object resultObj = answerMap.get("result");
            Boolean result = (resultObj instanceof Boolean) ? (Boolean) resultObj : null;

            boolean selected = answerId != null && selectedIds.contains(answerId);

            details.add(AttemptGradingResponse.AnswerDetail.builder()
                    .answerId(answerId)
                    .value(value)
                    .result(result)
                    .selected(selected)
                    .build());
        }

        return details;
    }

    private List<AttemptGradingResponse.TableRowDetail> buildTableRowDetails(
            List<?> rowsObj,
            Map<String, Object> studentAnswer
    ) {
        List<AttemptGradingResponse.TableRowDetail> details = new ArrayList<>();

        List<Integer> studentRows = new ArrayList<>();
        if (studentAnswer != null) {
            Object rowsAnswerObj = studentAnswer.get("rows");
            if (rowsAnswerObj instanceof List<?>) {
                studentRows = ((List<?>) rowsAnswerObj).stream()
                        .filter(Number.class::isInstance)
                        .map(n -> ((Number) n).intValue())
                        .toList();
            }
        }

        for (int i = 0; i < rowsObj.size(); i++) {
            Object item = rowsObj.get(i);
            if (!(item instanceof Map<?, ?>)) {
                continue;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> rowMap = (Map<String, Object>) item;
            String label = (String) rowMap.get("label");
            Object correctIndexObj = rowMap.get("correctIndex");
            Integer correctIndex = (correctIndexObj instanceof Number) ?
                    ((Number) correctIndexObj).intValue() : null;

            Integer selectedIndex = (i < studentRows.size()) ? studentRows.get(i) : null;

            details.add(AttemptGradingResponse.TableRowDetail.builder()
                    .label(label)
                    .correctIndex(correctIndex)
                    .selectedIndex(selectedIndex)
                    .build());
        }

        return details;
    }

    @Override
    @Transactional
    public void sendResultNotifications(Long sessionId) {
        if (sessionId == null) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_ID_REQUIRED);
        }

        // Kiểm tra session tồn tại
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_SESSION_NOT_FOUND));

        // Query tất cả các attempt đã chấm (gradingStatus = DONE) của session này
        List<ExamAttempt> attempts = examAttemptRepository.findByExamSessionIdAndGradingStatus(
                sessionId,
                ExamAttempt.GradingStatus.DONE
        );

        if (attempts.isEmpty()) {
            log.info("No graded attempts found for session {}", sessionId);
            return;
        }

        log.info("Found {} graded attempts for session {}, sending result notifications", attempts.size(), sessionId);

        int successCount = 0;
        int skipCount = 0;
        int errorCount = 0;

        for (ExamAttempt attempt : attempts) {
            // Kiểm tra email có hợp lệ không
            if (attempt.getStudentEmail() == null || attempt.getStudentEmail().isBlank()) {
                log.warn("Attempt {} has no student email, skipping email notification", attempt.getId());
                skipCount++;
                continue;
            }

            try {
                sendResultEmailForAttempt(attempt);
                successCount++;
            } catch (Exception e) {
                log.error("Failed to send result email for attempt {}: {}", attempt.getId(), e.getMessage(), e);
                errorCount++;
                // Tiếp tục gửi cho các attempt khác
            }
        }

        log.info("Result notification summary for session {}: {} sent, {} skipped, {} errors",
                sessionId, successCount, skipCount, errorCount);
    }

    @Override
    @Transactional
    public void sendResultNotificationForAttempt(Long attemptId) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_ATTEMPT_NOT_FOUND));

        if (attempt.getGradingStatus() != ExamAttempt.GradingStatus.DONE) {
            throw new ResponseException(BadRequestError.EXAM_ATTEMPT_NOT_SUBMITTED);
        }

        if (attempt.getStudentEmail() == null || attempt.getStudentEmail().isBlank()) {
            throw new ResponseException(BadRequestError.INVALID_EMAIL_FORMAT);
        }

        sendResultEmailForAttempt(attempt);
        log.info("Result notification email queued for attempt {} to {}", attemptId, attempt.getStudentEmail());
    }

    private void sendResultEmailForAttempt(ExamAttempt attempt) {
        ExamSession session = attempt.getExamSession();
        Exam exam = session.getExam();

        List<ExamAttemptQuestion> questions = attempt.getAttemptQuestions();
        int totalQuestions = questions.size();
        int correctAnswers = (int) questions.stream()
                .filter(q -> Boolean.TRUE.equals(q.getCorrect()))
                .count();
        int incorrectAnswers = (int) questions.stream()
                .filter(q -> Boolean.FALSE.equals(q.getCorrect()))
                .count();

        BigDecimal maxScore = questions.stream()
                .map(ExamAttemptQuestion::getPoint)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal finalScore = attempt.getScoreManual() != null &&
                attempt.getScoreManual().compareTo(BigDecimal.ZERO) > 0
                ? attempt.getScoreManual()
                : attempt.getScoreAuto();

        int accuracy = totalQuestions > 0
                ? (int) Math.round((correctAnswers * 100.0) / totalQuestions)
                : 0;

        // Format thời gian
        String duration = session.getDurationMinutes() + " phút";
        String submittedDate = attempt.getSubmittedAt() != null
                ? attempt.getSubmittedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : "N/A";

        // Lấy cheating logs
        List<String> cheatingLogs = new ArrayList<>();
        boolean hasCheatingLogs = false;

        if (attempt.getLogs() != null && !attempt.getLogs().isEmpty()) {
            for (Log log : attempt.getLogs()) {
                if (log.getSeverity() == Log.Severity.WARNING ||
                        log.getSeverity() == Log.Severity.SERIOUS ||
                        log.getSeverity() == Log.Severity.CRITICAL) {
                    hasCheatingLogs = true;
                    String logMessage = buildLogMessage(log);
                    if (logMessage != null) {
                        cheatingLogs.add(logMessage);
                    }
                }
            }
        }

        // Thêm fullscreen exit count nếu có
        if (attempt.getFullscreenExitCount() != null && attempt.getFullscreenExitCount() > 0) {
            hasCheatingLogs = true;
            cheatingLogs.add("Thoát chế độ toàn màn hình " + attempt.getFullscreenExitCount() + " lần");
        }

        String subject = "Kết quả bài thi - " + exam.getName();

        mailPersistenceService.createResultMail(
                attempt.getStudentEmail(),
                subject,
                "mail-notification-result-template",
                attempt.getStudentName() != null ? attempt.getStudentName() : attempt.getStudentEmail(),
                exam.getName(),
                session.getCode(),
                duration,
                submittedDate,
                finalScore,
                maxScore,
                totalQuestions,
                correctAnswers,
                incorrectAnswers,
                accuracy,
                hasCheatingLogs,
                cheatingLogs,
                attempt.getId()
        );

        log.info("Result notification email queued for attempt {} to {}", attempt.getId(), attempt.getStudentEmail());
    }

    private String buildLogMessage(Log log) {
        if (log.getMessage() != null && !log.getMessage().isBlank()) {
            return log.getMessage();
        }

        switch (log.getLogType()) {
            case FULLSCREEN_EXIT:
                return "Thoát chế độ toàn màn hình";
            case TAB_SWITCH:
                return "Chuyển tab trình duyệt";
            case DEVTOOLS_OPEN:
                return "Mở công cụ phát triển";
            case COPY_PASTE_ATTEMPT:
                return "Thực hiện copy/paste";
            case SUSPICIOUS_ACTIVITY:
                return "Hành vi nghi ngờ";
            default:
                return null;
        }
    }
}
