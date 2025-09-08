package com.datn.exam.model.entity;

import com.datn.exam.support.converter.BaseQuestionConverter;
import com.datn.exam.support.enums.Level;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.enums.Status;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public abstract class Question extends AuditableEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    private String text;

    @Convert(converter = BaseQuestionConverter.class)
    @Column(name = "question_value", columnDefinition = "JSON")
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



    @Version
    private Integer version;

    @Transient
    public QuestionType getType() {
        return questionValue != null ? questionValue.getType() : null;
    }

    @Transient
    public Level getLevel() {
        return questionValue != null ? questionValue.getLevel() : null;
    }

    @Transient
    public Boolean getIsPublic() {
        return questionValue != null && questionValue.isPublic();
    }


    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type", visible = true)
    @JsonSubTypes({
            @JsonSubTypes.Type(value = OneChoiceQuestion.class, name = "one_choice"),
            @JsonSubTypes.Type(value = MultiChoiceQuestion.class, name = "multi_choice"),
            @JsonSubTypes.Type(value = TrueFalseChoiceQuestion.class, name = "true_false"),
            @JsonSubTypes.Type(value = EssayQuestion.class, name = "essay"),
            @JsonSubTypes.Type(value = PlainTextQuestion.class, name = "plain_text"),
            @JsonSubTypes.Type(value = TableChoiceQuestion.class, name = "table_choice")
    })
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static abstract class BaseQuestion {
        private QuestionType type;
        private boolean isPublic;

        @Column(nullable = false)
        @Enumerated(EnumType.STRING)
        private Status status;

        private Level level;

        protected BaseQuestion(QuestionType type, Level level, Status status) {
            this.type = type;
            this.level = level;
            this.isPublic = false;
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

        protected MultiAnswerQuestion(List<Answer> answers, QuestionType questionType, Level level, Status status) {
            super(questionType, level, status);
            this.answers = answers != null ? answers : new ArrayList<>();
        }
    }

    @Data
    @NoArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    public static class OneChoiceQuestion extends MultiAnswerQuestion {

        public OneChoiceQuestion(List<Answer> answers, Level level, Status status) {
            super(answers, QuestionType.ONE_CHOICE, level, status);
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

        public MultiChoiceQuestion(List<Answer> answers, Level level, Status status) {
            super(answers, QuestionType.MULTI_CHOICE, level, status);
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

        public TrueFalseChoiceQuestion(List<Answer> answers, Level level, Status status) {
            super(answers, QuestionType.TRUE_FALSE, level, status);
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

        public EssayQuestion(Level level, Status status) {
            super(QuestionType.ESSAY, level, status);
        }

        @Override
        public QuestionType getType() {
            return QuestionType.ESSAY;
        }
    }

    @Data
    @NoArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    public static class PlainTextQuestion extends BaseQuestion {
        private String expectedAnswer;
        private Boolean caseSensitive = false;
        private Boolean exactMatch = false;

        public PlainTextQuestion(Level level, Status status) {
            super(QuestionType.PLAIN_TEXT, level, status);
        }

        @Override
        public QuestionType getType() {
            return QuestionType.PLAIN_TEXT;
        }
    }

    @Data
    @NoArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    public static class TableChoiceQuestion extends BaseQuestion {
        private List<String> headers = new ArrayList<>();
        private List<List<Answer>> rows = new ArrayList<>();

        public TableChoiceQuestion(Level level, Status status) {
            super(QuestionType.TABLE_CHOICE, level, status);
        }

        @Override
        public QuestionType getType() {
            return QuestionType.TABLE_CHOICE;
        }
    }
}

