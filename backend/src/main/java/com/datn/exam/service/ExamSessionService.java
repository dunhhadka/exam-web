package com.datn.exam.service;

import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.request.ExamSessionFilterRequest;
import com.datn.exam.model.dto.request.ExamSessionRequest;
import com.datn.exam.model.dto.request.IdsRequest;
import com.datn.exam.model.dto.request.SessionUserFilterRequest;
import com.datn.exam.model.dto.response.ExamSessionResponse;
import com.datn.exam.model.dto.response.SessionStatsResponse;
import com.datn.exam.model.dto.response.SessionUserResponse;

public interface ExamSessionService {
    ExamSessionResponse create(ExamSessionRequest request);
    ExamSessionResponse update(Long id, ExamSessionRequest request);
    PageDTO<ExamSessionResponse> filter(ExamSessionFilterRequest request);
    void delete(IdsRequest request);
    ExamSessionResponse getById(Long id);
    SessionStatsResponse getSessionStats(Long id);
    PageDTO<SessionUserResponse> getSessionUsers(Long id, SessionUserFilterRequest request);

    int count(ExamSessionFilterRequest request);
}
