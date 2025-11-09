package com.datn.exam.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionUserResponse {
    private Long id;
    private String name;
    private String role;
    private String email;
    private String code;
    private String gender;
    private String status;
}
