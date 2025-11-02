package com.datn.exam.service.impl;

import com.datn.exam.model.dto.mapper.AnswerPayloadMapper;
import com.datn.exam.model.dto.request.StartAttemptRequest;
import com.datn.exam.model.dto.request.SubmitAttemptRequest;
import com.datn.exam.model.dto.response.AttemptDetailResponse;
import com.datn.exam.model.dto.response.GuestAccess;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.model.entity.*;
import com.datn.exam.repository.*;
import com.datn.exam.service.AutoGradingService;
import com.datn.exam.service.ExamAttemptService;
import com.datn.exam.service.ExamJoinService;
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
import java.time.Instant;
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

        Instant startedAt = Instant.now();
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
                .ipAddress(request.getIpAddress())
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

        Instant submittedAt = Instant.now();
        Instant expireAt = attempt.getStartedAt()
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
        boolean hasEssay = false;

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

            if (question.getType() == QuestionType.ESSAY) {
                hasEssay = true;
            }
        }

        attempt.setScoreAuto(totalAutoScore);
        attempt.setSubmittedAt(submittedAt);
        attempt.setStatus(ExamAttempt.AttemptStatus.SUBMITTED);
        attempt.setGradingStatus(hasEssay ? ExamAttempt.GradingStatus.PENDING : ExamAttempt.GradingStatus.DONE);

        examAttemptRepository.save(attempt);

        return this.buildAttemptDetailResponse(attempt, attempt.getExamSession().getDurationMinutes());
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

        Instant now = Instant.now();
        Instant expireAt = attempt.getStartedAt()
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
        attempt.setSubmittedAt(Instant.now());
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

        Instant now = Instant.now();
        if (session.getStartTime() != null && now.isBefore(session.getStartTime())) {
            throw new ResponseException(BadRequestError.EXAM_SESSION_STARTED);
        }

        if (session.getEndTime() != null) {
            long lateJoinSeconds = (session.getLateJoinMinutes() != null ? session.getLateJoinMinutes() : 0) * 60L;
            Instant finalDeadline = session.getEndTime().plusSeconds(lateJoinSeconds);
            if (now.isAfter(finalDeadline)) {
                throw new ResponseException(BadRequestError.EXAM_SESSION_ENDED);
            }
        }
    }

    private List<ExamQuestion> shuffleQuestions(List<ExamQuestion> src, boolean shuffle) {
        if (!shuffle) return new ArrayList<>(src);

        List<ExamQuestion> copy = new ArrayList<>(src);
        ThreadLocalRandom rnd = ThreadLocalRandom.current();

        for(int i = copy.size() - 1; i > 0; i--) {
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

    private AttemptDetailResponse buildAttemptDetailResponse(
            ExamAttempt attempt,
            Integer durationMinutes
    ) {
        List<ExamAttemptQuestion> questions = attempt.getAttemptQuestions();
        Instant expireAt = attempt.getStartedAt().plusSeconds((long) durationMinutes * 60);

        List<AttemptDetailResponse.QuestionResponse> questionResponses = questions.stream()
                .map(this::mapToQuestionResponse)
                .toList();

        return AttemptDetailResponse.builder()
                .attemptId(attempt.getId())
                .sessionId(attempt.getExamSession().getId())
                .sessionName(attempt.getExamSession().getName())
                .attemptNo(attempt.getAttemptNo())
                .status(attempt.getStatus())
                .gradingStatus(attempt.getGradingStatus())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .expireAt(expireAt)
                .scoreAuto(attempt.getScoreAuto())
                .scoreManual(attempt.getScoreManual())
                .questions(questionResponses)
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

        if (qv != null) {
            switch (type) {
                case ESSAY -> {
                    Object minObj = qv.get("minWords");
                    Object maxObj = qv.get("maxWords");
                    minWords = (minObj instanceof Number) ? ((Number) minObj).intValue() : null;
                    maxWords = (maxObj instanceof Number) ? ((Number) maxObj).intValue() : null;
                }
                case TABLE_CHOICE -> {
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
                default -> {}
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
                .build();
    }

}
