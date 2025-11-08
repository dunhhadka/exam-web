package com.datn.exam.service.question;

import com.datn.exam.model.dto.request.question.QuestionEditRequest;
import com.datn.exam.model.dto.response.InvalidFieldError;
import com.datn.exam.model.dto.response.QuestionResponse;
import com.datn.exam.model.entity.Question;
import com.datn.exam.repository.QuestionRepository;
import com.datn.exam.support.exception.DomainValidationException;
import com.datn.exam.support.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class QuestionEditService {

    private final QuestionRepository questionRepository;

    private final QuestionEditContextService questionEditContextService;

    /*
    * TODO: Sửa lại isPublic
    * */
    @Transactional
    public QuestionResponse edit(long questionId, QuestionEditRequest request) {
        var question = this.findQuestionById(questionId);

        this.checkCanEdit(question);

        var context = questionEditContextService.createContext(request);

        return null;
    }

    private void checkCanEdit(Question question) {
        var userInfo = SecurityUtils.getCurrentUser()
                .orElseThrow(() -> new IllegalArgumentException("require authenticate from login"));

        if (!Objects.equals(question.getCreatedBy(), userInfo)) {
            throw new DomainValidationException(InvalidFieldError.builder()
                    .message("Bạn không có quyền chỉnh sửa câu hỏi này")
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
