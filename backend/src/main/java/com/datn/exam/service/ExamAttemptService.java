package com.datn.exam.service;

import com.datn.exam.model.dto.request.ManualGradingRequest;
import com.datn.exam.model.dto.request.StartAttemptRequest;
import com.datn.exam.model.dto.request.SubmitAttemptRequest;
import com.datn.exam.model.dto.response.AttemptDetailResponse;
import com.datn.exam.model.dto.response.AttemptGradingResponse;
import com.datn.exam.model.dto.response.AttemptListResponse;

import java.util.List;

public interface ExamAttemptService {
    AttemptDetailResponse startAttempt(StartAttemptRequest request);

    AttemptDetailResponse submitAttempt(Long attemptId, SubmitAttemptRequest request, String sessionToken);

    AttemptDetailResponse getCurrentAttempt(Long sessionId, String sessionToken);

    List<AttemptListResponse> getAttemptBySession(Long sessionId);
    
    AttemptGradingResponse getAttemptForGrading(Long attemptId);
    
    void manualGrading(Long attemptId, ManualGradingRequest request);

}
