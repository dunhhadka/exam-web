package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.request.ManualGradingRequest;
import com.datn.exam.model.dto.request.StartAttemptRequest;
import com.datn.exam.model.dto.request.SubmitAttemptRequest;
import com.datn.exam.model.dto.response.AttemptDetailResponse;
import com.datn.exam.model.dto.response.AttemptGradingResponse;
import com.datn.exam.model.dto.response.AttemptListResponse;
import com.datn.exam.model.dto.response.Response;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/exam-attempt")
public interface ExamAttemptController {

    @PostMapping
    Response<AttemptDetailResponse> startAttempt(
            @Valid @RequestBody StartAttemptRequest request,
            HttpServletRequest servletRequest
    );

    @PutMapping("/{attemptId}")
    Response<AttemptDetailResponse> submitAttempt(
            @PathVariable Long attemptId,
            @Valid @RequestBody SubmitAttemptRequest request,
            @RequestHeader(name = "X-Session-Token", required = true) String sessionToken
    );

    @GetMapping("/current/{sessionId}")
    Response<AttemptDetailResponse> getCurrentAttempt(@PathVariable Long sessionId);
    
    @GetMapping("/session/{sessionId}")
    Response<List<AttemptListResponse>> getAttemptsBySession(@PathVariable Long sessionId);
    
    @GetMapping("/{attemptId}/grading")
    Response<AttemptGradingResponse> getAttemptForGrading(@PathVariable Long attemptId);
    
    @PostMapping("/{attemptId}/grading")
    Response<Void> manualGrading(
            @PathVariable Long attemptId,
            @Valid @RequestBody ManualGradingRequest request
    );

}
