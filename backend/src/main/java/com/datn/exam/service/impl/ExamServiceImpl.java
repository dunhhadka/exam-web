package com.datn.exam.service.impl;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.request.ExamCreateRequest;
import com.datn.exam.model.dto.request.ExamDraftRequest;
import com.datn.exam.model.dto.request.ExamFilterRequest;
import com.datn.exam.model.dto.response.ExamResponse;
import com.datn.exam.model.entity.Question;
import com.datn.exam.repository.ExamRepository;
import com.datn.exam.repository.QuestionRepository;
import com.datn.exam.service.ExamService;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.List;

import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Slf4j
public class ExamServiceImpl implements ExamService {
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;

    @Override
    public ExamResponse createDraft(ExamDraftRequest request) {
        return null;
    }

    @Override
    public ExamResponse createPublish(ExamCreateRequest request) {
        List<Long> ids = request.getQuestions().stream()
                .map(ExamCreateRequest.QuestionRequest::getId)
                .toList();

        List<Question> questions = questionRepository.findByIds(ids);

        var idsSet = questions.stream().map(Question::getId)
                .collect(Collectors.toSet());

        String idsNotFound = ids.stream()
                .filter(i -> !idsSet.contains(i))
                .map(String::valueOf)
                .collect(Collectors.joining(", "));

        if (StringUtils.isNotBlank(idsNotFound)) {
            throw new ResponseException(NotFoundError.QUESTION_NOT_FOUND, idsNotFound);
        }

        //TODO: Code continue;
        return null;
    }


    @Override
    public PageDTO<ExamResponse> filter(ExamFilterRequest request) {
        return null;
    }

    @Override
    public ExamResponse update() {
        return null;
    }

    @Override
    public void delete(Long id) {

    }
}
