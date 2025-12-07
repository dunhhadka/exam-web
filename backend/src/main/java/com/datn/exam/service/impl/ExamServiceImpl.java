package com.datn.exam.service.impl;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.mapper.ExamMapper;
import com.datn.exam.model.dto.request.*;
import com.datn.exam.model.dto.response.ExamResponse;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.model.entity.Exam;
import com.datn.exam.model.entity.ExamQuestion;
import com.datn.exam.model.entity.Question;
import com.datn.exam.model.entity.Tag;
import com.datn.exam.repository.ExamRepository;
import com.datn.exam.repository.QuestionRepository;
import com.datn.exam.repository.TagRepository;
import com.datn.exam.repository.data.dao.ExamDao;
import com.datn.exam.repository.data.dao.JdbcQuestionDao;
import com.datn.exam.repository.data.dto.ExamDto;
import com.datn.exam.service.ExamService;
import com.datn.exam.support.enums.Status;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.DomainValidationException;
import com.datn.exam.support.exception.ResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Slf4j
public class ExamServiceImpl implements ExamService {
    private final ExamRepository examRepository;
    private final ExamDao examDao;
    private final QuestionRepository questionRepository;
    private final JdbcQuestionDao questionDao;
    private final TagRepository tagRepository;
    private final ExamMapper examMapper;

    @Override
    public ExamResponse createDraft(ExamDraftRequest request) {

        List<Tag> tags = validateAndGetTags(request.getIdsTag());

        var score = request.getScore();
        if (score == null) {
            score = request.getQuestions().stream()
                    .map(ExamDraftRequest.QuestionRequest::getPoint)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(1, RoundingMode.CEILING);
        }

        Exam exam = Exam.builder()
                .name(request.getName())
                .level(request.getLevel())
                .score(null)
                .isPublic(request.isPublic())
                .status(Status.DRAFT)
                .deleted(Boolean.FALSE)
                .tags(tags)
                .examQuestions(new ArrayList<>()) // Empty list of questions for a draft
                .build();

        examRepository.save(exam);
        return examMapper.toExamResponse(exam);
    }

    @Override
    public ExamResponse createPublish(ExamCreateRequest request) {
        Map<Long, Question> questionMap = validateAndGetQuestions(request.getQuestions());

        List<Tag> tags = validateAndGetTags(request.getIdsTag());

        var score = request.getScore();
        if (score == null) {
            score = request.getQuestions().stream()
                    .map(ExamCreateRequest.QuestionRequest::getPoint)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(1, RoundingMode.CEILING);
        }

        Exam exam = Exam.builder()
                .name(request.getName())
                .level(request.getLevel())
                .score(score)
                .isPublic(request.isPublic())
                .status(Status.PUBLISHED)
                .deleted(Boolean.FALSE)
                .tags(tags)
                .build();

        List<ExamQuestion> examQuestions = new ArrayList<>();

        for (int i = 0; i < request.getQuestions().size(); i++) {
            var questionRequest = request.getQuestions().get(i);

            ExamQuestion examQuestion = ExamQuestion.builder()
                    .question(questionMap.get(questionRequest.getId()))
                    .point(questionRequest.getPoint())
                    .orderIndex(i)
                    .build();

            examQuestions.add(examQuestion);
        }

        exam.setExamQuestions(examQuestions);

        examRepository.save(exam);
        return examMapper.toExamResponse(exam);
    }


    @Override
    public PageDTO<ExamResponse> filter(ExamFilterRequest request) {
        Long count = this.examDao.count(request);

        if (Objects.equals(count, 0L)) {
            return PageDTO.empty(request.getPageIndex(), request.getPageSize());
        }

        List<ExamDto> examDtoList = this.examDao.search(request);

        List<ExamResponse> examResponses = examDtoList.stream().map(examMapper::toExamResponse)
                .toList();

        return PageDTO.of(examResponses, request.getPageIndex(), request.getPageSize(), count);
    }

    @Override
    public ExamResponse update(Long examId, ExamUpdateRequest request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseException(NotFoundError.EXAM_NOT_FOUND, examId.toString()));

        Map<Long, Question> questionMap = validateAndGetQuestions(request.getQuestions());

        List<Tag> tags = validateAndGetTags(request.getIdsTag());

        clearDataBeforeUpdate(exam);

        this.examMapper.updateExam(exam, request);

        List<ExamQuestion> examQuestions = new ArrayList<>();
        for (int i = 0; i < request.getQuestions().size(); i++) {
            var questionRequest = request.getQuestions().get(i);

            ExamQuestion examQuestion = ExamQuestion.builder()
                    .question(questionMap.get(questionRequest.getId()))
                    .point(questionRequest.getPoint())
                    .orderIndex(i)
                    .build();

            examQuestions.add(examQuestion);
        }

        exam.getExamQuestions().addAll(examQuestions);
        exam.getTags().addAll(tags);

        examRepository.save(exam);
        return examMapper.toExamResponse(exam);
    }

    private void clearDataBeforeUpdate(Exam exam) {
        if (CollectionUtils.isNotEmpty(exam.getExamQuestions())) {
            exam.getExamQuestions().clear();
        }
        if (CollectionUtils.isEmpty(exam.getTags())) {
            exam.getTags().clear();
        }
    }

    @Override
    public void delete(List<Long> ids) {
        List<ExamDto> exams = examDao.findByIds(ids);
        Set<Long> idsSet = exams.stream().map(ExamDto::getId)
                .collect(Collectors.toSet());

        String idsNotFound = ids.stream()
                .filter(i -> !idsSet.contains(i))
                .map(String::valueOf)
                .collect(Collectors.joining(", "));

        if (StringUtils.isNotEmpty(idsNotFound)) {
            throw new ResponseException(NotFoundError.EXAM_NOT_FOUND, idsNotFound);
        }

        examRepository.deleteAllByIdInBatch(ids);
    }

    @Override
    public Integer count(ExamFilterRequest request) {
        return this.examDao.count(request).intValue();
    }

    @Override
    public ExamResponse getById(long id) {
        var exam = this.examRepository.findById(id)
                .orElseThrow(() -> new DomainValidationException(InvalidFieldError.builder()
                        .message("Không tìm thấy bài thi")
                        .build()));
        return examMapper.toExamResponse(exam);
    }

    private List<Tag> validateAndGetTags(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Tag> tags = tagRepository.findByIds(tagIds);

        Set<Long> foundTagIds = tags.stream()
                .map(Tag::getId)
                .collect(Collectors.toSet());

        String idsTagNotFound = tagIds.stream()
                .filter(id -> !foundTagIds.contains(id))
                .map(String::valueOf)
                .collect(Collectors.joining(", "));

        if (StringUtils.isNotBlank(idsTagNotFound)) {
            throw new ResponseException(BadRequestError.TAG_NOT_FOUND, idsTagNotFound);
        }

        return tags;
    }

    private Map<Long, Question> validateAndGetQuestions(List<ExamCreateRequest.QuestionRequest> questionRequests) {
        if (CollectionUtils.isEmpty(questionRequests)) {
            return new HashMap<>();
        }

        List<Long> ids = questionRequests.stream()
                .map(ExamCreateRequest.QuestionRequest::getId)
                .toList();

        List<Question> questions = questionRepository.findByIds(ids);

        Map<Long, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        Set<Long> foundIds = questionMap.keySet();
        String idsNotFound = questionRequests.stream()
                .map(ExamCreateRequest.QuestionRequest::getId)
                .filter(id -> !foundIds.contains(id))
                .map(String::valueOf)
                .collect(Collectors.joining(", "));

        if (StringUtils.isNotBlank(idsNotFound)) {
            throw new ResponseException(NotFoundError.QUESTION_NOT_FOUND, idsNotFound);
        }

        return questionMap;
    }
}
