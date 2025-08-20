package com.datn.exam.support.constants;

import com.datn.exam.support.enums.Permission;
import com.datn.exam.support.enums.ResourceCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;
import java.util.Map;

public interface Constants {

    @Getter
    @AllArgsConstructor
    enum DefaultRole {
        ADMIN(Map.of(
                ResourceCode.ALL, List.of(Permission.MANAGE)
        )),
        TEACHER(Map.of(
                ResourceCode.ASSIGNMENT, List.of(Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.DELETE),
                ResourceCode.STUDENT, List.of(Permission.READ)
        )),
        STUDENT(Map.of(

        ))
        ;

        final Map<ResourceCode, List<Permission>> privileges;
    }

    @Getter
    @AllArgsConstructor
    enum DefaultUser {
        ADMIN("admin", "Admin123", "admin@gmail.com", DefaultRole.ADMIN);
        final String username;
        final String password;
        final String email;
        final DefaultRole defaultRole;
    }
}
