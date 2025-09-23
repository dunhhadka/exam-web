package com.datn.exam.model.entity;

import com.datn.exam.support.enums.AccountType;
import com.datn.exam.support.enums.ActiveStatus;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class User extends AuditableEntity{
    @Id
    @Column
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID id;

    private String email;

    private String password;

    @Embedded
    @JsonUnwrapped
    @Valid
    private UserInformation information;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ActiveStatus status;

    @Column(name = "account_type")
    @Enumerated(EnumType.STRING)
    private AccountType accountType;

    @Column(nullable = false)
    private Boolean deleted;

    @Column(nullable = false)
    @Version
    private Long version;

    @OneToMany(mappedBy = "user", fetch = FetchType.EAGER, orphanRemoval = true, cascade = CascadeType.PERSIST)
    @Fetch(FetchMode.SUBSELECT)
    private List<UserRole> userRoles;
}
