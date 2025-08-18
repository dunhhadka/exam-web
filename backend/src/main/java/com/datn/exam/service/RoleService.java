package com.datn.exam.service;

import com.datn.exam.model.entity.Role;

import java.util.List;

public interface RoleService {
    void init();

    List<Role> getAvailableRoles();
}
