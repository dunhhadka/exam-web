package com.datn.exam.service.impl;

import com.datn.exam.model.entity.Role;
import com.datn.exam.repository.RoleRepository;
import com.datn.exam.service.RoleService;
import com.datn.exam.support.constants.Constants;
import com.datn.exam.support.enums.ActiveStatus;
import com.datn.exam.support.util.IdUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleServiceImpl implements RoleService {
    private final RoleRepository roleRepository;

    @Override
    public void init() {
        List<String> defaultRoleCodes = Arrays.stream(Constants.DefaultRole.values())
                .map(Enum::name)
                .toList();

        List<Role> existedRoles = roleRepository.findAllByCodes(defaultRoleCodes);

        List<Role> roles = new ArrayList<>();

        for (Constants.DefaultRole defaultRole : Constants.DefaultRole.values()) {
            Optional<Role> roleOptional = existedRoles.stream()
                    .filter(role -> Objects.equals(role.getCode(), defaultRole.name()))
                    .findFirst();

            if (roleOptional.isEmpty()) {
                Role role = Role.builder()
                        .id(IdUtils.nextId())
                        .code(defaultRole.name())
                        .name(defaultRole.name())
                        .status(ActiveStatus.ACTIVE)
                        .deleted(Boolean.FALSE)
                        .build();

                roles.add(role);
            }
        }

        roleRepository.saveAll(roles);
    }

    @Override
    public List<Role> getAvailableRoles() {
        return List.of();
    }
}
