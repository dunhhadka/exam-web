package com.datn.exam.service.impl;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.mapper.QuestionMapper;
import com.datn.exam.model.dto.request.*;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.dto.response.TagResponse;
import com.datn.exam.model.entity.Answer;
import com.datn.exam.model.entity.Question;
import com.datn.exam.model.entity.Tag;
import com.datn.exam.repository.QuestionRepository;
import com.datn.exam.repository.TagRepository;
import com.datn.exam.repository.data.dao.QuestionDao;
import com.datn.exam.repository.data.dao.TagDao;
import com.datn.exam.repository.data.dto.QuestionDto;
import com.datn.exam.repository.data.dto.QuestionTagDto;
import com.datn.exam.service.QuestionService;
import com.datn.exam.service.validation.ChoiceQuestionPublishValidator;
import com.datn.exam.service.validation.TableChoicePublishValidator;
import com.datn.exam.support.enums.ActiveStatus;
import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.DomainValidationException;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.SecurityUtils;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {
    private final QuestionRepository questionRepository;
    private final QuestionMapper questionMapper;
    private final TagRepository tagRepository;
    private final QuestionDao questionDao;
    private final TagDao tagDao;
    private final TableChoicePublishValidator tableValidator;
    private final ChoiceQuestionPublishValidator choiceValidator;

    @Override
    public QuestionResponse createPublish(QuestionCreateRequest request) {
        log.info("Creating question with type: {}, status: PUBLISHED", Status.PUBLISHED);

        var objectName = request.getClass().getName();

        List<InvalidFieldError> errors = new ArrayList<>();

        errors.addAll(choiceValidator.validate(request, objectName));
        errors.addAll(tableValidator.validate(request, objectName));

        if (!errors.isEmpty()) {
            throw new DomainValidationException(errors);
        }

        Question question = this.buildQuestionEntity(request, Status.PUBLISHED);

        questionRepository.save(question);

        return questionMapper.toQuestionResponse(question);
    }

    @Override
    public QuestionResponse createDraft(DraftCreateRequest request) {

        this.validateDraft(request);

        Question draftQuestion = this.buildQuestionEntity(request, Status.DRAFT);

        var userId = SecurityUtils.getCurrentUserId();

        draftQuestion.setCreatedBy(userId.toString());
        draftQuestion.setCreatedAt(LocalDateTime.now());

        questionRepository.save(draftQuestion);

        return questionMapper.toQuestionResponse(draftQuestion);
    }

    @Override
    public QuestionResponse update(QuestionUpdateRequest request) {
        return null;
    }

    @Override
    public boolean delete(long id) {
        return false;
    }


    private Question getById(long id) {
        return this.questionRepository.findById(id)
                .orElseThrow(() -> new DomainValidationException(
                        InvalidFieldError.builder()
                                .message("Không tỉm thấy câu hỏi với id là" + id)
                                .build()));
    }

    @Override
    public PageDTO<QuestionResponse> search(QuestionSearchRequest request) {
        Long count = this.questionDao.count(request);

        if (Objects.equals(count, 0L)) {
            return PageDTO.empty(request.getPageIndex(), request.getPageSize());
        }

        List<QuestionDto> questionDtoList = this.questionDao.search(request);

        List<Long> questionIds = questionDtoList.stream()
                .map(QuestionDto::getId)
                .toList();

        List<QuestionTagDto> questionTags = this.tagDao.findTagByQuestionIds(questionIds);

        Map<Long, List<TagResponse>> tagMap = questionTags.stream()
                .collect(Collectors.groupingBy(QuestionTagDto::getQuestionId,
                        Collectors.mapping(QuestionTagDto::toTagResponse, Collectors.toList())
                ));

        List<QuestionResponse> questions = questionDtoList.stream()
                .map(dto -> {
                            QuestionResponse question = questionMapper.toQuestionResponse(dto);

                            List<TagResponse> tags = tagMap.getOrDefault(dto.getId(), List.of());

                            question.setTags(tags);

                            return question;
                        }
                ).toList();

        return PageDTO.of(questions, request.getPageIndex(), request.getPageSize(), count);
    }

    @Override
    public Integer count(QuestionSearchRequest request) {
        return this.questionDao.count(request).intValue();
    }

    @Override
    public QuestionResponse findById(long questionId) {
        var question = this.questionRepository.findById(questionId)
                .orElseThrow(() -> new ConstraintViolationException("Không tìm thấy câu hỏi", null));
        return this.questionMapper.toQuestionResponse(question);
    }

    private void validateDraft(DraftCreateRequest request) {
        if (this.needsAnswers(request.getType()) && CollectionUtils.isEmpty(request.getAnswers())) {
            throw new ResponseException(BadRequestError.ANSWER_MIN_ONE_REQUIRE);
        }

        if (this.needsAnswers(request.getType())) {
            boolean hasCorrectAnswer = request.getAnswers().stream()
                    .anyMatch(AnswerCreateRequest::getResult);

            if (!hasCorrectAnswer) {
                throw new ResponseException(BadRequestError.ANSWER_REQUIRE_CORRECT);
            }
        }
    }

    private Question buildQuestionEntity(QuestionCreateBase request, Status status) {
        Question.BaseQuestion questionValue = buildQuestionValue(request, status);

        Question question = Question.builder()
                .text(request.getText())
                .point(request.getPoint())
                .questionValue(questionValue)
                .activeStatus(ActiveStatus.ACTIVE)
                .build();

        this.buildTags(question, request.getTagIds());
        this.buildAnswers(question, request.getAnswers());

        return question;
    }

    private Question.BaseQuestion buildQuestionValue(QuestionCreateBase request, Status status) {
        Level level = request.getLevel();
        boolean isPublic = request.isPublic();

        return switch (request.getType()) {
            case ONE_CHOICE -> new Question.OneChoiceQuestion(null, level, status, isPublic);
            case MULTI_CHOICE -> new Question.MultiChoiceQuestion(null, level, status, isPublic);
            case TRUE_FALSE -> new Question.TrueFalseChoiceQuestion(null, level, status, isPublic);
            case ESSAY -> buildEssayQuestionValue(request, status, isPublic);
            case PLAIN_TEXT -> buildPlainTextQuestionValue(request, status, isPublic);
            case TABLE_CHOICE -> this.buildTableChoiceQuestionValue(request, status, isPublic);
        };
    }

    private Question.PlainTextQuestion buildPlainTextQuestionValue(QuestionCreateBase request, Status status, boolean isPublic) {

        return new Question.PlainTextQuestion(
                request.getExpectedAnswer(),
                request.getCaseSensitive(),
                request.getExactMatch(),
                request.getLevel(),
                status,
                isPublic
        );
    }

    private Question.TableChoiceQuestion buildTableChoiceQuestionValue(QuestionCreateBase request, Status status, boolean isPublic) {
        List<Question.RowCompact> rows = request.getRows().stream()
                .filter(Objects::nonNull)
                .map(r -> new Question.RowCompact(r.getLabel(), r.getCorrectIndex()))
                .toList();

        return new Question.TableChoiceQuestion(
                request.getHeaders(),
                rows,
                request.getLevel(),
                status,
                isPublic
        );
    }

    private Question.EssayQuestion buildEssayQuestionValue(QuestionCreateBase request,Status status, boolean isPublic) {

        return new Question.EssayQuestion(
                request.getLevel(),
                status,
                isPublic,
                request.getMaxWords(),
                request.getMinWords(),
                request.getSimpleAnswer(),
                request.getGradingCriteria()
        );
    }

    private void buildAnswers(Question question, List<AnswerCreateRequest> answerRequests) {
        List<Answer> answers = null;

        if (!needsAnswers(question.getType()) || CollectionUtils.isEmpty(answerRequests)) {
            return;
        }

        if (CollectionUtils.isEmpty(question.getAnswers())) {
            question.setAnswers(new ArrayList<>());
        }

        AtomicInteger index = new AtomicInteger(0);
        answerRequests.forEach(a -> {
            Answer answer = Answer.builder()
                    .orderIndex(index.getAndIncrement())
                    .value(a.getValue())
                    .result(a.getResult())
                    .explanation(a.getExplanation())
                    .explanationHtml(a.getExplanationHtml())
                    .build();

            answer.setQuestion(question);

            question.getAnswers().add(answer);
        });
    }

    private void buildTags(Question question, List<Long> tagIds) {
        if (CollectionUtils.isNotEmpty(tagIds)) {
            List<Tag> tags = tagRepository.findByIds(tagIds);

            Set<Long> tagIdSet = tags.stream()
                    .map(Tag::getId)
                    .collect(Collectors.toSet());

            String tagNotFoundStr = tagIds.stream()
                    .filter(id -> !tagIdSet.contains(id))
                    .map(String::valueOf)
                    .collect(Collectors.joining(", "));

            if (StringUtils.isNotEmpty(tagNotFoundStr)) {
                throw new ResponseException(NotFoundError.TAG_NOT_FOUND, tagNotFoundStr);
            }

            question.setTags(tags);
        }
    }

    private boolean needsAnswers(QuestionType type) {
        return type == QuestionType.ONE_CHOICE ||
                type == QuestionType.MULTI_CHOICE ||
                type == QuestionType.TRUE_FALSE;
    }

    private boolean isFilterEmpty(QuestionSearchRequest request) {
        return request.getType() == null
                && request.getLevel() == null
                && request.getPublicFlag() == null
                && request.getTagName() == null
                && request.getStatus() == null
                && (request.getKeyword() == null || request.getKeyword().isBlank());
    }
}
