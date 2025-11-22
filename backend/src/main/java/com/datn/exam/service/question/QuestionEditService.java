package com.datn.exam.service.question;

import com.datn.exam.model.dto.request.question.QuestionEditRequest;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.entity.Question;
import com.datn.exam.repository.QuestionRepository;
import com.datn.exam.service.QuestionService;
import com.datn.exam.support.enums.QuestionType;
import com.datn.exam.support.exception.DomainValidationException;
import com.datn.exam.support.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionEditService {

    private final QuestionRepository questionRepository;

    private final QuestionEditContextService questionEditContextService;

    private final QuestionService questionService;

    /*
     * TODO: Sửa lại isPublic
     * */
    @Transactional
    public QuestionResponse edit(long questionId, QuestionEditRequest request) {
        var question = this.findQuestionById(questionId);

        this.checkCanEditPublicFlag(question, request);
        if (!Objects.equals(question.getType(), request.getType())) {
            throw new DomainValidationException(InvalidFieldError.builder()
                    .message("Không thể chỉnh sửa loại câu hỏi")
                    .build());
        }

        var questionContext = questionEditContextService.createContext(request);

        question.updateBaseInfo(questionContext);

        if (questionContext instanceof QuestionEditContextService.OneChoiceContext context) {
            question.updateOneChoiceQuestion(context);
        } else if (questionContext instanceof QuestionEditContextService.MultiChoiceContext context) {
            question.updateMultiChoiceQuestion(context);
        } else if (questionContext instanceof QuestionEditContextService.TrueFalseAnswerContext context) {
            question.updateTrueFalseQuestion(context);
        } else if (questionContext instanceof QuestionEditContextService.TextAnswerContext context) {
            question.updateTextPlainQuestion(context);
        } else if (questionContext instanceof QuestionEditContextService.TableChoiceContext context) {
            question.updateTableChoiceQuestion(context);
        } else {
            throw new DomainValidationException(InvalidFieldError.builder()
                    .message("Not implementation for context")
                    .build());
        }

        this.questionRepository.save(question);

        return this.questionService.findById(questionId);
    }

    private void checkCanEditPublicFlag(Question question, QuestionEditRequest request) {
        var isPublic = question.getIsPublic();

        var userInfo = SecurityUtils.getCurrentUser()
                .orElseThrow(() -> new IllegalArgumentException("require authenticate from login"));

        if (!Objects.equals(question.getCreatedBy(), userInfo) && !isPublic) {
            throw new DomainValidationException(InvalidFieldError.builder()
                    .message("Bạn không có quyền chỉnh sửa câu hỏi này")
                    .build());
        }

        boolean isChangeStatusNotPermission = !Objects.equals(isPublic, request.isPublic())
                && !Objects.equals(question.getCreatedBy(), userInfo);
        if (isChangeStatusNotPermission) {
            throw new DomainValidationException(InvalidFieldError.builder()
                    .message("Bạn không thể chuyển trạng thái của câu hỏi do người khác tạo")
                    .build());
        }
    }

    private Question findQuestionById(long questionId) {
        return this.questionRepository.findById(questionId)
                .orElseThrow(() -> new DomainValidationException(InvalidFieldError.builder()
                        .message("Không tìm thấy câu hỏi với id là " + questionId)
                        .build()));
    }
}
