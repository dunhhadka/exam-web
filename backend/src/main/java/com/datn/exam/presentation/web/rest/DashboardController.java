package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.response.DashboardStatsResponse;
import com.datn.exam.model.dto.response.Response;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;

@RequestMapping("/api/dashboard")
public interface DashboardController {
    
    @GetMapping("/stats")
    @ResponseStatus(HttpStatus.OK)
    Response<DashboardStatsResponse> getDashboardStats();
}
