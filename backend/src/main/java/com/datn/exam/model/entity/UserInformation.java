package com.datn.exam.model.entity;

import com.datn.exam.support.constants.ValidateConstraint;
import com.datn.exam.support.enums.Gender;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInformation {
    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(length = ValidateConstraint.Length.PHONE_MAX_LENGTH)
    private String phone;

    @Column(name = "date_of_birth")
    private Instant dateOfBirth;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column()
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(length = ValidateConstraint.Length.ADDRESS_MAX_LENGTH)
    private String address;

    public String buildFullName() {
        return Stream.of(firstName, lastName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining(" "));
    }
}
