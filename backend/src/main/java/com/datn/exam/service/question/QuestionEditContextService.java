package com.datn.exam.service.question;

import com.datn.exam.model.dto.request.question.QuestionEditRequest;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.model.entity.Tag;
import com.datn.exam.repository.TagRepository;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.exception.DomainValidationException;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionEditContextService {

    private final TagRepository tagRepository;

    // region interface
    public interface QuestionEditContext {
        QuestionType type();

        String text();

        BigDecimal point();

        Map<Long, Tag> tags();

        boolean isPublic();
    }

    public interface AnswerContext {

    }

    public interface TrueFalseAnswerContext extends AnswerContext {
        Boolean value();
    }

    public interface QuestionChoiceAnswerContext extends AnswerContext {
        int index();

        String answerText();

        Boolean answerValue();
    }

    @Builder
    public record QuestionChoiceAnswer(int index, String answerText,
                                       Boolean answerValue) implements QuestionChoiceAnswerContext {

    }

    public interface OneChoiceContext extends QuestionEditContext {
        List<QuestionChoiceAnswerContext> answers();
    }
    // endregion interface

    public QuestionEditContext createContext(QuestionEditRequest request) {
        final var type = request.getType();
        return switch (type) {
            case ONE_CHOICE -> createOneChoiceContext(request);
            case MULTI_CHOICE -> null;
            case PLAIN_TEXT -> null;
            case ESSAY -> null;
            case TRUE_FALSE -> null;
            case TABLE_CHOICE -> null;
        };
    }

    public abstract class AbstractBaseContext implements QuestionEditContext {

        private final QuestionEditRequest request;

        private final QuestionType questionType;
        private final String text;
        private final BigDecimal point;
        private Map<Long, Tag> tags;
        private final boolean isPublic;

        protected AbstractBaseContext(QuestionEditRequest request) {
            this.request = request;

            this.questionType = request.getType();
            this.text = request.getText();
            this.point = request.getPoint();
            this.isPublic = request.isPublic();

            this.fetchTags(request.getTagIds());
        }

        private void fetchTags(List<Long> tagIds) {
            if (CollectionUtils.isEmpty(tagIds)) {
                return;
            }

            var tags = tagRepository.findByIds(tagIds).stream()
                    .collect(Collectors.toMap(Tag::getId, Function.identity()));
            String tagsNotFound = tagIds.stream()
                    .filter(tagId -> !tags.containsKey(tagId))
                    .distinct()
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
            if (StringUtils.isNotEmpty(tagsNotFound)) {
                throw new DomainValidationException(InvalidFieldError.builder()
                        .message("Tags không tìm thấy " + tagsNotFound)
                        .build());
            }

            this.tags = tags;
        }

        @Override
        public QuestionType type() {
            return this.questionType;
        }

        @Override
        public String text() {
            return this.text;
        }

        @Override
        public BigDecimal point() {
            return this.point;
        }

        @Override
        public Map<Long, Tag> tags() {
            return this.tags;
        }

        @Override
        public boolean isPublic() {
            return this.isPublic;
        }

        protected List<QuestionChoiceAnswerContext> fetchAnswerContext() {
            var answersRequest = this.request.getAnswers();
            if (CollectionUtils.isEmpty(answersRequest)) {
                throw new DomainValidationException(InvalidFieldError.builder()
                        .message("Phải có ít nhất 1 câu trả lời cho câu hỏi này")
                        .build());
            }

            var questionAnswerContext = IntStream.range(0, answersRequest.size())
                    .mapToObj(i -> {
                        var answer = answersRequest.get(i);
                        return (QuestionChoiceAnswerContext) QuestionChoiceAnswer
                                .builder()
                                .index(i)
                                .answerText(answer.getValue())
                                .answerValue(answer.getResult())
                                .build();
                    })
                    .toList();

            //this.validate(questionAnswerContext);

            return questionAnswerContext;
        }

        protected abstract void validate(AnswerContext answer);
    }

    private QuestionEditContext createOneChoiceContext(QuestionEditRequest request) {
        return new OneChoiceContextImpl(request);
    }

    private class OneChoiceContextImpl extends AbstractBaseContext
            implements OneChoiceContext {

        private final List<QuestionChoiceAnswerContext> answers;

        public OneChoiceContextImpl(QuestionEditRequest request) {
            super(request);

            this.answers = fetchAnswerContext();
        }

        @Override
        protected void validate(AnswerContext answer) {

        }

        @Override
        public List<QuestionChoiceAnswerContext> answers() {
            return this.answers;
        }
    }
}
