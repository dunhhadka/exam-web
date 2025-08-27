package com.datn.exam.model.entity;

import com.datn.exam.support.enums.Permission;
import com.datn.exam.support.enums.ResourceCode;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "role_privileges")
@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class RolePrivilege extends AuditableEntity{
    @Id
    @Column()
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID id;

    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID roleId;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ResourceCode resourceCode;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Permission permission;

    @Column(nullable = false)
    private Boolean deleted;
}
