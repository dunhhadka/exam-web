package com.datn.exam.service.impl;

import com.datn.exam.model.dto.UserAuthority;
import com.datn.exam.model.entity.Role;
import com.datn.exam.model.entity.RolePrivilege;
import com.datn.exam.model.entity.User;
import com.datn.exam.model.entity.UserRole;
import com.datn.exam.repository.RolePrivilegeRepository;
import com.datn.exam.repository.RoleRepository;
import com.datn.exam.repository.UserRepository;
import com.datn.exam.repository.UserRoleRepository;
import com.datn.exam.service.AuthenticationService;
import com.datn.exam.support.enums.ActiveStatus;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final RolePrivilegeRepository rolePrivilegeRepository;

    @Override
    public UserAuthority getUserAuthority(UUID id) {
        User user = userRepository.findActiveById(id)
                .orElseThrow(() -> new ResponseException(NotFoundError.USER_NOT_FOUND));

        List<UserRole> userRoles = userRoleRepository.findByUser(id);

        List<UUID> roleIds = userRoles.stream()
                .map(userRole -> userRole.getRole().getId())
                .toList();

        List<Role> roles = roleRepository.findActiveByIds(roleIds);

        List<UUID> activeRoleIds = roles.stream()
                .filter(r -> Objects.equals(r.getStatus(), ActiveStatus.ACTIVE))
                .map(Role::getId)
                .toList();

        List<String> roleNames = roles.stream()
                .filter(r -> Objects.equals(r.getStatus(), ActiveStatus.ACTIVE))
                .map(Role::getName)
                .toList();

        List<RolePrivilege> rolePrivileges = rolePrivilegeRepository
                .findAllByRoleId(activeRoleIds);

        List<String> permissions = rolePrivileges.stream()
                .filter(rp -> !rp.getDeleted())
                .map(rolePrivilege ->
                        rolePrivilege.getResourceCode().name().toLowerCase() + ":" +
                                rolePrivilege.getPermission().name().toLowerCase())
                .distinct()
                .toList();

        return UserAuthority.builder()
                .userId(id)
                .email(user.getEmail())
                .roles(roleNames)
                .permissions(permissions)
                .build();
    }
}