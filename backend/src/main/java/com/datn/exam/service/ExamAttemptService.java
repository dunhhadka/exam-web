package com.datn.exam.service;

import com.datn.exam.model.dto.request.StartAttemptRequest;
import com.datn.exam.model.dto.request.SubmitAttemptRequest;
import com.datn.exam.model.dto.response.AttemptDetailResponse;

public interface ExamAttemptService {
    AttemptDetailResponse startAttempt(StartAttemptRequest request);

    AttemptDetailResponse submitAttempt(Long attemptId, SubmitAttemptRequest request, String sessionToken);

    AttemptDetailResponse getCurrentAttempt(Long sessionId, String sessionToken);
}
