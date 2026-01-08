package com.datn.exam.presentation.web.rest.impl;

import com.datn.exam.dto.response.UserResponse;
import com.datn.exam.model.dto.PageDTO;
import com.datn.exam.model.dto.response.PagingResponse;
import com.datn.exam.model.entity.User;
import com.datn.exam.presentation.web.rest.UserController;
import com.datn.exam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Slf4j
public class UserControllerImpl implements UserController {

    private final UserRepository userRepository;

    @Override
    public PagingResponse<UserResponse> searchStudents(
            String keyword,
            String role,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage;
        
        if (keyword != null && !keyword.trim().isEmpty()) {
            userPage = userRepository.searchStudents(keyword.trim(), pageable);
        } else {
            userPage = userRepository.findAllStudents(pageable);
        }
        
        List<UserResponse> userResponses = userPage.getContent().stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId().toString())
                        .email(user.getEmail())
                        .name(user.getInformation() != null ? user.getInformation().buildFullName() : "")
                        .build())
                .collect(Collectors.toList());
        
        PageDTO<UserResponse> pageDTO = PageDTO.of(
                userResponses,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements()
        );
        
        return PagingResponse.of(pageDTO);
    }
}
