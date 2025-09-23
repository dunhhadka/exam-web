package com.datn.exam.model.entity;

import com.datn.exam.support.converter.BaseQuestionConverter;
import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.*;
import lombok.*;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(precision = 5, scale = 2)
    private BigDecimal point;

    private String text;

    @Convert(converter = BaseQuestionConverter.class)
    @Column(name = "question_value",columnDefinition = "JSON")
    private BaseQuestion questionValue; //Entity inner class

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "question_tags",
            joinColumns = @JoinColumn(name = "question_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags = new ArrayList<>();

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("index ASC")
    private List<Answer> answers = new ArrayList<>();

    @OneToMany(mappedBy = "question")
    private List<ExamQuestion> examQuestions;

    @Version
    private Integer version;

    public QuestionType getType() {
        return questionValue != null ? questionValue.getType() : null;
    }

    public Level getLevel() {
        return questionValue != null ? questionValue.getLevel() : null;
    }

    public Boolean getIsPublic() {
        return questionValue != null && questionValue.isPublicFlag();
    }

    public Status getStatus() {
        return questionValue != null ? questionValue.getStatus() : null;
    }

    public boolean isDraft() {
        return this.getStatus() == Status.DRAFT;
    }

    public boolean isPublisher() {
        return this.getStatus() == Status.PUBLISHED;
    }

    public boolean isArchived() {
        return this.getStatus() == Status.ARCHIVED;
    }

    public boolean canBePublished() {
        if (this.isDraft()) {
            return isValidForPublish();
        }

        return false;
    }

    public boolean isValidForPublish() {

        if (!this.checkCountAnswerWithQuestionType()) {
            return false;
        }

        if (CollectionUtils.isEmpty(this.answers)) {
            this.answers = new ArrayList<>();
        }

        long correctCount = answers.stream()
                .filter(a -> Boolean.TRUE.equals(a.getResult()))
                .count();

        QuestionType type = this.getType();

        return switch (type) {
            case ONE_CHOICE, TRUE_FALSE -> correctCount == 1;
            case MULTI_CHOICE -> correctCount > 0;
            default -> true;
        };
    }

    private boolean checkCountAnswerWithQuestionType() {
        QuestionType type = this.getType();

        switch (type) {
            case TRUE_FALSE -> {
                return answers.size() == 2;
            }
            case ONE_CHOICE, MULTI_CHOICE -> {
                return answers.size() >= 2;
            }
            default -> {
                return true;
            }
        }
    }

    public boolean isChoiceType() {
        QuestionType type = getType();

        return type == QuestionType.ONE_CHOICE ||
                type == QuestionType.MULTI_CHOICE ||
                type == QuestionType.TRUE_FALSE;
    }

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type", visible = true)
    @JsonSubTypes({
            @JsonSubTypes.Type(value = OneChoiceQuestion.class, name = "ONE_CHOICE"),
            @JsonSubTypes.Type(value = MultiChoiceQuestion.class, name = "MULTI_CHOICE"),
            @JsonSubTypes.Type(value = TrueFalseChoiceQuestion.class, name = "TRUE_FALSE"),
            @JsonSubTypes.Type(value = EssayQuestion.class, name = "ESSAY"),
            @JsonSubTypes.Type(value = PlainTextQuestion.class, name = "PLAIN_TEXT"),
            @JsonSubTypes.Type(value = TableChoiceQuestion.class, name = "TABLE_CHOICE")
    })

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static abstract class BaseQuestion {
        private QuestionType type;

        @JsonProperty("public_flag")
        private boolean publicFlag;

        private Status status;

        private Level level;

        protected BaseQuestion(QuestionType type, Level level, Status status, boolean isPublic) {
            this.type = type;
            this.level = level;
            this.publicFlag = isPublic;
            this.status = status;
        }

        public abstract QuestionType getType();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    public static abstract class MultiAnswerQuestion extends BaseQuestion {
        private List<Answer> answers = new ArrayList<>();

        protected MultiAnswerQuestion(List<Answer> answers, QuestionType questionType, Level level, Status status, boolean isPublic) {
            super(questionType, level, status, isPublic);
            this.answers = answers != null ? answers : new ArrayList<>();
        }
    }

    @Data
    @NoArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    public static class OneChoiceQuestion extends MultiAnswerQuestion {

        public OneChoiceQuestion(List<Answer> answers, Level level, Status status, boolean isPublic) {
            super(answers, QuestionType.ONE_CHOICE, level, status, isPublic);
        }

        @Override
        public QuestionType getType() {
            return QuestionType.ONE_CHOICE;
        }
    }

    @Data
    @NoArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    public static class MultiChoiceQuestion extends MultiAnswerQuestion {

        public MultiChoiceQuestion(List<Answer> answers, Level level, Status status, boolean isPublic) {
            super(answers, QuestionType.MULTI_CHOICE, level, status, isPublic);
        }

        @Override
        public QuestionType getType() {
            return QuestionType.MULTI_CHOICE;
        }
    }

    @Data
    @NoArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    public static class TrueFalseChoiceQuestion extends MultiAnswerQuestion {

        public TrueFalseChoiceQuestion(List<Answer> answers, Level level, Status status, boolean isPublic) {
            super(answers, QuestionType.TRUE_FALSE, level, status, isPublic);
        }

        @Override
        public QuestionType getType() {
            return QuestionType.TRUE_FALSE;
        }
    }

    @Data
    @NoArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    public static class EssayQuestion extends BaseQuestion {
        private Integer maxWords;
        private Integer minWords;
        private String sampleAnswer;
        private String gradingCriteria;

        public EssayQuestion(Level level, Status status, boolean isPublic) {
            super(QuestionType.ESSAY, level, status, isPublic);
        }
        public EssayQuestion(
                Level level,
                Status status,
                boolean isPublic,
                Integer maxWords,
                Integer minWords,
                String sampleAnswer,
                String gradingCriteria
        ) {
            super(QuestionType.ESSAY, level, status, isPublic);

            this.maxWords = maxWords;
            this.minWords = minWords;
            this.sampleAnswer = sampleAnswer;
            this.gradingCriteria = gradingCriteria;
        }

        @Override
        public QuestionType getType() {
            return QuestionType.ESSAY;
        }
    }

    @Data
    @NoArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    @AllArgsConstructor
    public static class PlainTextQuestion extends BaseQuestion {
        private String expectedAnswer;
        private Boolean caseSensitive; // CHECK lowercase uppercase?
        private Boolean exactMatch; //TRUE: MATCH 100%

        public PlainTextQuestion(String expectedAnswer, Boolean caseSensitive, Boolean exactMatch, Level level, Status status, boolean isPublic) {
            super(QuestionType.PLAIN_TEXT, level, status, isPublic);

            this.setField(expectedAnswer, caseSensitive, exactMatch);
        }

        @Override
        public QuestionType getType() {
            return QuestionType.PLAIN_TEXT;
        }

        private void setField(String expectedAnswer, Boolean caseSensitive, Boolean exactMatch) {
            if (!StringUtils.isBlank(expectedAnswer)) {
                this.expectedAnswer = expectedAnswer;
                this.caseSensitive = (caseSensitive != null) ? caseSensitive : false;
                this.exactMatch = exactMatch != null;
            } else {
                this.expectedAnswer = null;
                this.caseSensitive = null;
                this.exactMatch = null;
            }
        }
    }

    @Data
    @NoArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    public static class TableChoiceQuestion extends BaseQuestion {
        private List<String> headers = new ArrayList<>();
        private List<List<Answer>> rows = new ArrayList<>();

        public TableChoiceQuestion(Level level, Status status, boolean isPublic) {
            super(QuestionType.TABLE_CHOICE, level, status, isPublic);
        }

        @Override
        public QuestionType getType() {
            return QuestionType.TABLE_CHOICE;
        }
    }
}

