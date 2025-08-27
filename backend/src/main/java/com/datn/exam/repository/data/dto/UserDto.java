package com.datn.exam.repository.data.dto;

import com.datn.exam.support.enums.Gender;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class UserDto {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private Instant dateOfBirth;
    private String avatarUrl;
    private Gender gender;
    private String address;
    private Boolean deleted;
}
