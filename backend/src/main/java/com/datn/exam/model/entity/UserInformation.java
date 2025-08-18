package com.datn.exam.model.entity;

import com.datn.exam.support.constants.ValidateConstraint;
import com.datn.exam.support.enums.Gender;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInformation {
    private String firstName;

    private String lastName;

    @Column(length = ValidateConstraint.Length.PHONE_MAX_LENGTH)
    private String phone;

    @Column()
    private Instant dateOfBirth;

    @Column()
    private String avatarUrl;

    @Column()
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(length = ValidateConstraint.Length.ADDRESS_MAX_LENGTH)
    private String address;

}
