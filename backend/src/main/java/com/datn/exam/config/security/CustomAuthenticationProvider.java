package com.datn.exam.config.security;

import com.datn.exam.model.entity.Role;
import com.datn.exam.model.entity.RolePrivilege;
import com.datn.exam.model.entity.User;
import com.datn.exam.model.entity.UserRole;
import com.datn.exam.repository.RolePrivilegeRepository;
import com.datn.exam.repository.UserRepository;
import com.datn.exam.support.enums.ActiveStatus;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
@RequiredArgsConstructor
public class CustomAuthenticationProvider implements AuthenticationProvider {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RolePrivilegeRepository rolePrivilegeRepository;

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        log.debug("Authenticating {}", authentication);

        String credential = authentication.getName();
        String password = (String) authentication.getCredentials();

        User user = userRepository.findByCredential(credential)
                .orElseThrow(() -> new ResponseException(NotFoundError.USER_NOT_FOUND));

        if (Objects.equals(user.getStatus(), ActiveStatus.INACTIVE))
            throw new ResponseException(BadRequestError.USER_WAS_INACTIVATED);

        if (!passwordEncoder.matches(password, user.getPassword()))
            throw new ResponseException(BadRequestError.LOGIN_FAILED);

        return new UsernamePasswordAuthenticationToken(credential, password, Collections.emptyList());
    }

    private List<SimpleGrantedAuthority> loadUserAuthorities(User user) {
        Set<String> authorities = new HashSet<>();

        List<Role> roles = user.getUserRoles().stream()
                .filter(ur -> !ur.getDeleted())
                .map(UserRole::getRole)
                .filter(r -> Objects.equals(r.getStatus(), ActiveStatus.ACTIVE) && !r.getDeleted())
                .toList();

        roles.forEach(role -> authorities.add("ROLE_" + role.getCode()));

        roles.forEach(role -> {
            List<RolePrivilege> privileges = rolePrivilegeRepository.findAllByRoleId(List.of(role.getId()));

            privileges.forEach(privilege -> {
                authorities.add(privilege.getResourceCode() + ":" + privilege.getPermission());
            });
        });
        return authorities.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return CustomUserAuthentication.class.isAssignableFrom(authentication);
    }
}
