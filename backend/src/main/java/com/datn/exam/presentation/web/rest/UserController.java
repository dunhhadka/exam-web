package com.datn.exam.presentation.web.rest;

import com.datn.exam.model.dto.response.PagingResponse;
import com.datn.exam.dto.response.UserResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RequestMapping("/api/users")
public interface UserController {
    
    @GetMapping("/search")
    PagingResponse<UserResponse> searchStudents(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    );
}
