package com.datn.exam.model.dto.response;

import com.datn.exam.support.enums.Gender;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class ProfileResponse {
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private Instant dateOfBirth;
    private String avatarUrl;
    private Gender gender;
    private String address;
    private Boolean deleted;
    private List<String> permissions;
    private List<String> roles;
}
