package com.datn.exam.service.impl;

import com.datn.exam.config.properties.AuthenticationProperties;
import com.datn.exam.config.security.TokenProvider;
import com.datn.exam.model.dto.request.RegisterRequest;
import com.datn.exam.model.entity.Role;
import com.datn.exam.model.entity.User;
import com.datn.exam.model.entity.UserRole;
import com.datn.exam.repository.RoleRepository;
import com.datn.exam.repository.UserRepository;
import com.datn.exam.service.AccountService;
import com.datn.exam.service.AuthenticationService;
import com.datn.exam.support.constants.Constants;
import com.datn.exam.support.enums.AccountType;
import com.datn.exam.support.enums.ActiveStatus;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.IdUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountServiceImpl implements AccountService {
    private final TokenProvider tokenProvider;
    private final AuthenticationProperties authenticationProperties;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationService authenticationService;
    private final RoleRepository roleRepository;

    @Transactional
    @Override
    public void register(RegisterRequest request) {

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ResponseException(BadRequestError.PASSWORD_MISS_MATCH);
        }

        Optional<User> userOptional = userRepository.findSystemByEmail(request.getEmail());

        if (userOptional.isPresent()) {
            throw new ResponseException(BadRequestError.EMAIL_EXISTED);
        }

        User user = User.builder()
                .id(IdUtils.nextId())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .status(ActiveStatus.ACTIVE)
                .accountType(AccountType.SYSTEM)
                .deleted(Boolean.FALSE)
                .build();

        String roleName = request.isTeacher()
                ? Constants.DefaultRole.TEACHER.name()
                : Constants.DefaultRole.STUDENT.name();

        Role memberRole = roleRepository.findByCode(roleName).orElse(null);

        if (Objects.isNull(memberRole)) throw new ResponseException(NotFoundError.ROLE_NOT_FOUNT);

        UserRole userRole = UserRole.builder()
                .id(IdUtils.nextId())
                .user(user)
                .role(memberRole)
                .deleted(Boolean.FALSE)
                .build();

        user.setUserRoles(List.of(userRole));

        userRepository.save(user);

        //TODO: Add otp, cache with otp and send email
    }
}
