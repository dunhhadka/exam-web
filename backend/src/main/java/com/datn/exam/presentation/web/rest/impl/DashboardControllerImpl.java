package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.model.dto.response.DashboardStatsResponse;
import com.datn.exam.model.dto.response.Response;
import com.datn.exam.presentation.web.rest.DashboardController;
import com.datn.exam.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class DashboardControllerImpl implements DashboardController {
    private final DashboardService dashboardService;

    @Override
    public Response<DashboardStatsResponse> getDashboardStats() {
        return Response.of(dashboardService.getDashboardStats());
    }
}
