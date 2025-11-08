package com.datn.exam.service.question;

import com.datn.exam.model.dto.request.question.QuestionEditRequest;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.model.entity.Tag;
import com.datn.exam.repository.TagRepository;
import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.exception.DomainValidationException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionEditContextService {

    private final TagRepository tagRepository;

    public QuestionEditContext createContext(QuestionEditRequest request) {
        var type = request.getType();

        var tagIds = request.getTagIds().stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        var tags = this.fetchTags(tagIds);

        return switch (type) {
            case ONE_CHOICE -> new OneChoiceContext(request, tags);
            case MULTI_CHOICE -> new MultiChoiceContext(request, tags);
            case TRUE_FALSE -> new TrueFalseAnswerContext(request, tags);
            case PLAIN_TEXT -> new TextAnswerContext(request, tags);
            case ESSAY -> null;
            case TABLE_CHOICE -> null;
        };
    }

    private Map<Long, Tag> fetchTags(List<Long> tagIds) {
        if (CollectionUtils.isEmpty(tagIds)) {
            return Map.of();
        }

        Map<Long, Tag> tags = tagRepository.findByIds(tagIds).stream()
                .collect(Collectors.toMap(Tag::getId, Function.identity()));

        String tagsNotFound = tagIds.stream()
                .filter(tagId -> !tags.containsKey(tagId))
                .distinct()
                .map(Object::toString)
                .collect(Collectors.joining(", "));

        if (StringUtils.isNotEmpty(tagsNotFound)) {
            throw new DomainValidationException(InvalidFieldError.builder()
                    .message("Tags không tìm thấy: " + tagsNotFound)
                    .build());
        }

        return tags;
    }

    @Getter
    public static abstract class QuestionEditContext {
        private final QuestionEditRequest request;

        private final QuestionType type;
        private final String text;
        private final BigDecimal point;
        private final Map<Long, Tag> tags;
        private final boolean isPublic;

        private final Level level;

        protected QuestionEditContext(QuestionEditRequest request, Map<Long, Tag> tags) {
            this.request = request;

            this.type = request.getType();
            this.text = request.getText();
            this.point = request.getPoint();
            this.tags = tags;
            this.isPublic = request.isPublic();
            this.level = request.getLevel();

            parseSpecificFields();

            this.validate();
        }

        protected abstract void parseSpecificFields();

        protected abstract void validate();

        protected List<ChoiceAnswer> parseChoiceAnswers() {
            var answersRequest = request.getAnswers();
            if (CollectionUtils.isEmpty(answersRequest)) {
                return Collections.emptyList();
            }

            return IntStream.range(0, answersRequest.size())
                    .mapToObj(index -> {
                        var answer = answersRequest.get(index);
                        return new ChoiceAnswer(
                                index,
                                answer.getValue(),
                                answer.getResult()
                        );
                    })
                    .toList();
        }

        protected void validateChoiceQuestion(List<ChoiceAnswer> answers) {
            boolean isValidAnswerSize = CollectionUtils.isNotEmpty(answers) && answers.size() >= 2;

            if (!isValidAnswerSize) {
                throw new DomainValidationException(InvalidFieldError.builder()
                        .message("Câu hỏi một lựa chọn phải có ít nhất 2 đáp án")
                        .build());
            }
        }

        protected void validateOneAnswer(Collection<?> collections) {
            if (CollectionUtils.isEmpty(collections)) {
                throw new DomainValidationException(InvalidFieldError.builder()
                        .message("Câu hỏi phải có một đáp án")
                        .build());
            }

            if (collections.size() > 1) {
                if (log.isDebugEnabled()) {
                    log.warn("Câu hỏi chỉ có 1 đáp án");
                }
            }
        }
    }

    public record ChoiceAnswer(int index, String text, Boolean result) {
    }

    public record TrueFalseAnswer(boolean isCorrect) {
    }

    public record TextAnswer(String text) {
    }

    @Getter
    public static final class TextAnswerContext extends QuestionEditContext {
        private TextAnswer answer;

        public TextAnswerContext(QuestionEditRequest request, Map<Long, Tag> tags) {
            super(request, tags);
        }

        @Override
        protected void parseSpecificFields() {
            var answers = getRequest().getAnswers();

            this.validateOneAnswer(answers);

            final var answerRequest = answers.get(0);

            var text = answerRequest.getExplanation();

            this.answer = new TextAnswer(text);
        }

        @Override
        protected void validate() {
            if (StringUtils.isBlank(answer.text())) {
                throw new DomainValidationException(InvalidFieldError.builder()
                        .message("Đáp án văn bản không được để trống")
                        .build());
            }
        }
    }

    @Getter
    public static final class TrueFalseAnswerContext extends QuestionEditContext {

        private TrueFalseAnswer answer;

        public TrueFalseAnswerContext(QuestionEditRequest request, Map<Long, Tag> tags) {
            super(request, tags);
        }

        @Override
        protected void parseSpecificFields() {
            this.answer = this.parseTrueFalseAnswer();
        }

        private TrueFalseAnswer parseTrueFalseAnswer() {
            var answers = getRequest().getAnswers();

            this.validateOneAnswer(answers);

            final var finalAnswer = answers.get(0);
            boolean isCorrect = BooleanUtils.isTrue(finalAnswer.getResult());

            return new TrueFalseAnswer(isCorrect);
        }

        @Override
        protected void validate() {
            //do nothing
        }
    }

    @Getter
    public static final class MultiChoiceContext extends QuestionEditContext {

        private List<ChoiceAnswer> answers;

        public MultiChoiceContext(QuestionEditRequest request, Map<Long, Tag> tags) {
            super(request, tags);
        }

        @Override
        protected void parseSpecificFields() {
            this.answers = this.parseChoiceAnswers();
        }

        @Override
        protected void validate() {

            this.validateChoiceQuestion(answers);

            long correctCount = answers.stream()
                    .filter(answer -> BooleanUtils.isTrue(answer.result()))
                    .count();
            if (correctCount < 1) {
                throw new DomainValidationException(InvalidFieldError.builder()
                        .message("Câu hỏi nhiều lựa chọn phải có ít nhất 1 đáp án đúng")
                        .build());
            }
        }
    }

    @Getter
    public static final class OneChoiceContext extends QuestionEditContext {
        private List<ChoiceAnswer> answers;

        public OneChoiceContext(QuestionEditRequest request, Map<Long, Tag> tags) {
            super(request, tags);
        }

        @Override
        protected void parseSpecificFields() {
            this.answers = parseChoiceAnswers();
        }

        @Override
        protected void validate() {
            this.validateChoiceQuestion(answers);

            long correctCount = answers.stream()
                    .filter(answer -> BooleanUtils.isTrue(answer.result()))
                    .count();
            if (correctCount != 1) {
                throw new DomainValidationException(InvalidFieldError.builder()
                        .message("Câu hỏi một lựa chọn phải có 1 đáp án đúng")
                        .build());
            }
        }
    }
}
