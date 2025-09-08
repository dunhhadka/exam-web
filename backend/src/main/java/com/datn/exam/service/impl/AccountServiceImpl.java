package com.datn.exam.service.impl;

import com.datn.exam.config.properties.AuthenticationProperties;
import com.datn.exam.config.security.CustomUserAuthentication;
import com.datn.exam.config.security.TokenProvider;
import com.datn.exam.model.dto.UserAuthority;
import com.datn.exam.model.dto.request.AuthenticateRequest;
import com.datn.exam.model.dto.request.RefreshTokenRequest;
import com.datn.exam.model.dto.request.RegisterRequest;
import com.datn.exam.model.dto.response.AuthenticateResponse;
import com.datn.exam.model.dto.response.ProfileResponse;
import com.datn.exam.model.entity.Role;
import com.datn.exam.model.entity.User;
import com.datn.exam.model.entity.UserInformation;
import com.datn.exam.model.entity.UserRole;
import com.datn.exam.repository.RoleRepository;
import com.datn.exam.repository.UserRepository;
import com.datn.exam.repository.data.dao.UserDao;
import com.datn.exam.service.AccountService;
import com.datn.exam.service.AuthenticationService;
import com.datn.exam.support.constants.Constants;
import com.datn.exam.support.enums.AccountType;
import com.datn.exam.support.enums.ActiveStatus;
import com.datn.exam.support.enums.Gender;
import com.datn.exam.support.enums.TokenType;
import com.datn.exam.support.enums.error.BadRequestError;
import com.datn.exam.support.enums.error.NotFoundError;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.IdUtils;
import com.datn.exam.support.util.SecurityUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

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
    private final UserDao userDao;

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
                .information(buildUserInformation(
                        request.getFirstName(),
                        request.getLastName(),
                        null,
                        null,
                        null,
                        null,
                        null
                ))
                .password(passwordEncoder.encode(request.getPassword()))
                .status(ActiveStatus.ACTIVE) // If add verify code then INACTIVE
                .accountType(AccountType.SYSTEM)
                .deleted(Boolean.FALSE)
                .build();

        String roleName = request.isTeacher()
                ? Constants.DefaultRole.TEACHER.name()
                : Constants.DefaultRole.STUDENT.name();

        Role memberRole = roleRepository.findByCode(roleName).orElse(null);

        if (Objects.isNull(memberRole)) throw new ResponseException(NotFoundError.ROLE_NOT_FOUND);

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

    @Override
    public AuthenticateResponse login(AuthenticateRequest request) {
        User user = userRepository.findByCredential(request.getCredential())
                .orElseThrow(() -> new ResponseException(NotFoundError.USER_NOT_FOUND));

        log.warn("User {} start login", user.getEmail());

        Authentication authentication = new CustomUserAuthentication(request.getCredential(), request.getPassword());

        authentication = authenticationManager.authenticate(authentication);

        String accessToken = tokenProvider.buildToken(authentication, user.getId(), TokenType.ACCESS_TOKEN);
        Duration accessTokenExpiresIn = authenticationProperties.getAccessTokenExpiresIn();
        Instant accessTokenExpiresAt = Instant.now().plus(accessTokenExpiresIn);

        String refreshToken;
        Duration refreshTokenExpiresIn;
        Instant refreshTokenExpiresAt;

        if (Objects.equals(request.getRememberMe(), Boolean.TRUE)) {
            refreshToken = tokenProvider.buildToken(authentication, user.getId(), TokenType.REFRESH_TOKEN);
            refreshTokenExpiresIn = authenticationProperties.getRefreshTokenExpiresIn();
        } else {
            refreshToken = tokenProvider.buildToken(authentication, user.getId(), TokenType.REFRESH_TOKEN_LONG);
            refreshTokenExpiresIn = authenticationProperties.getRefreshTokenLongExpiresIn();
        }

        refreshTokenExpiresAt = Instant.now().plus(refreshTokenExpiresIn);

        log.warn("User {} completed authentication", user.getEmail());

        return AuthenticateResponse.builder()
                .accessToken(accessToken)
                .accessTokenExpiresIn(accessTokenExpiresIn.toSeconds())
                .accessTokenExpiredAt(accessTokenExpiresAt)
                .refreshToken(refreshToken)
                .refreshTokenExpiresIn(refreshTokenExpiresIn.toSeconds())
                .refreshTokenExpiredAt(refreshTokenExpiresAt)
                .build();

    }

    @Override
    public void activeAccount() {

    }

    @Override
    public void activeAccount(UUID id) {

    }

    @Override
    public AuthenticateResponse refreshToken(RefreshTokenRequest request) {
        return null;
    }

    @Override
    public ProfileResponse getAccountProfile() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        log.warn("User get profile with id = {}", currentUserId);

        UserAuthority authority = authenticationService.getUserAuthority(currentUserId);

        var userDto = userDao.getById(currentUserId);

        return ProfileResponse.builder()
                .email(userDto.getEmail())
                .firstName(userDto.getFirstName())
                .lastName(userDto.getLastName())
                .phone(userDto.getPhone())
                .dateOfBirth(userDto.getDateOfBirth())
                .avatarUrl(userDto.getAvatarUrl())
                .gender(userDto.getGender())
                .address(userDto.getAddress())
                .deleted(userDto.getDeleted())
                .roles(authority.roles())
                .permissions(authority.permissions())
                .build();
    }

    private UserInformation buildUserInformation(String firstName,
                                                 String lastName,
                                                 String phone,
                                                 Instant dateOfBirth,
                                                 String avatarUrl,
                                                 Gender gender,
                                                 String address) {
        return new UserInformation(
                firstName,
                lastName,
                phone,
                dateOfBirth,
                avatarUrl,
                gender,
                address
        );
    }

}
