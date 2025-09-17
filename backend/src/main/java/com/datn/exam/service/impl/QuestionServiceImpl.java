package com.datn.exam.service.impl;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.mapper.QuestionMapper;
import com.datn.exam.model.dto.request.AnswerCreateRequest;
import com.datn.exam.model.dto.request.QuestionCreateRequest;
import com.datn.exam.model.dto.request.QuestionSearchRequest;
import com.datn.exam.model.dto.request.QuestionUpdateRequest;
import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.entity.Answer;
import com.datn.exam.model.entity.Question;
import com.datn.exam.model.entity.Tag;
import com.datn.exam.repository.QuestionRepository;
import com.datn.exam.repository.TagRepository;
import com.datn.exam.service.QuestionService;
import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.exception.ResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {
    private final QuestionRepository questionRepository;
    private final QuestionMapper questionMapper;
    private final TagRepository tagRepository;


    @Override
    public QuestionResponse createQuestion(QuestionCreateRequest request) {
        log.info("Creating question with type: {}, status: PUBLISHED", request.getStatus());

        Question question = this.buildQuestionEntity(request);

        questionRepository.save(question);

        return questionMapper.toQuestionResponse(question);
    }

    @Override
    public QuestionResponse createDraft(QuestionCreateRequest request) {
        return null;
    }

    @Override
    public QuestionResponse update(QuestionUpdateRequest request) {
        return null;
    }

    @Override
    public void delete(long id) {

    }

    //NOTE: Test api get
    @Override
    public PageDTO<QuestionResponse> search(QuestionSearchRequest request) {
        if (this.isFilterEmpty(request)) {
            List<Question> questions = this.questionRepository.findByText(request.getKeyword());

        }

        return null;
    }

    private Question buildQuestionEntity(QuestionCreateRequest request) {
        this.validateAnswerOrderIndex(request.getAnswers());

        Question.BaseQuestion questionValue = buildQuestionValue(request);

        Question question = Question.builder()
                .text(request.getText())
                .score(request.getScore())
                .questionValue(questionValue)
                .build();

        this.buildTags(question, request.getTagIds());

        this.buildAnswers(question, request.getAnswers());

        if (!question.isValidForPublish() && request.getStatus() == Status.PUBLISHED) {
            throw new ResponseException(BadRequestError.QUESTION_NOT_VALID);
        }

        return question;
    }

    private Question.BaseQuestion buildQuestionValue(QuestionCreateRequest request) {
        Level level = request.getLevel();
        Status status = request.getStatus();

        return switch (request.getType()) {
            case ONE_CHOICE -> new Question.OneChoiceQuestion(null, level, status);
            case MULTI_CHOICE -> new Question.MultiChoiceQuestion(null, level, status);
            case TRUE_FALSE -> new Question.TrueFalseChoiceQuestion(null, level, status);
            case ESSAY -> this.buildEssayQuestionValue(request);
            case PLAIN_TEXT -> this.buildPlainTextQuestionValue(request);
            case TABLE_CHOICE -> this.buildTableChoiceQuestionValue(request);
        };
    }

    private Question.PlainTextQuestion buildPlainTextQuestionValue(QuestionCreateRequest request) {
        return null;
    }

    private Question.TableChoiceQuestion buildTableChoiceQuestionValue(QuestionCreateRequest request) {
        return null;
    }

    private Question.EssayQuestion buildEssayQuestionValue(QuestionCreateRequest request) {

        return new Question.EssayQuestion(
                request.getLevel(),
                request.getStatus(),
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

        answerRequests.forEach(a -> {
            Answer answer = Answer.builder()
                    .orderIndex(a.getOrderIndex())
                    .value(a.getValue())
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
            question.setTags(tags);
        }
    }

    private boolean needsAnswers(QuestionType type) {
        return type == QuestionType.ONE_CHOICE ||
                type == QuestionType.MULTI_CHOICE ||
                type == QuestionType.TRUE_FALSE;
    }

    private void validateAnswerOrderIndex(List<AnswerCreateRequest> answers) {
        //NOTE: Check for duplicate orderIndex
        List<Integer> orderIndices = answers.stream()
                .map(AnswerCreateRequest::getOrderIndex)
                .toList();

        Map<Integer, Long> frequencyMap = orderIndices.stream()
                .collect(Collectors.groupingBy(i -> i, Collectors.counting()));

        if(frequencyMap.size() != orderIndices.size()) {
            List<Integer> duplicates = frequencyMap.entrySet().stream()
                    .filter(e -> e.getValue() > 1)
                    .map(Map.Entry::getKey)
                    .toList();

            throw new ResponseException(
                BadRequestError.ANSWER_DUPLICATE_ORDER_INDEX,
                    duplicates.toString()
            );
        }
    }

    private boolean isFilterEmpty(QuestionSearchRequest request) {
        return request.getType() == null
                && request.getLevel() == null
                && request.getIsPublic() == null
                && request.getTagName() == null
                && request.getStatus() == null
                && (request.getKeyword() == null || request.getKeyword().isBlank());
    }
}
