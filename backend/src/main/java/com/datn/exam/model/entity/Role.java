package com.datn.exam.model.entity;

import com.datn.exam.support.constants.ValidateConstraint;
import com.datn.exam.support.enums.ActiveStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "roles")
@EqualsAndHashCode(callSuper = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role extends AuditableEntity{
    @Id
    @Column()
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID id;

    @Column(length = ValidateConstraint.Length.CODE_MAX_LENGTH, unique = true, nullable = false)
    private String code;

    @Column(length = ValidateConstraint.Length.NAME_MAX_LENGTH, nullable = false)
    private String name;

    @Column()
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ActiveStatus status;

    @Column(nullable = false)
    private Boolean deleted;

    @Column(nullable = false)
    @Version
    private Long version;

    @OneToMany(mappedBy = "role", fetch = FetchType.EAGER, orphanRemoval = true, cascade = CascadeType.PERSIST)
    @Fetch(FetchMode.SUBSELECT)
    private List<UserRole> userRoles;
}
