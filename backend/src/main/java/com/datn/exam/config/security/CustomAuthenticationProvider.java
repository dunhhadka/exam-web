package com.datn.exam.config.security;

import com.datn.exam.model.entity.User;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Objects;

@Component
@Slf4j
@RequiredArgsConstructor
public class CustomAuthenticationProvider implements AuthenticationProvider {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        log.debug("Authenticating {}", authentication);

        String credential = authentication.getName();
        String password = (String) authentication.getCredentials();

        User user = userRepository.findByCredential(credential)
                .orElseThrow(() -> new ResponseException(NotFoundError.USER_NOT_FOUND));

        if (Objects.equals(user.getStatus(), ActiveStatus.INACTIVE)) throw new ResponseException(BadRequestError.USER_WAS_INACTIVATED);

        if (!passwordEncoder.matches(password, user.getPassword())) throw new ResponseException(BadRequestError.LOGIN_FAILED);

        return new UsernamePasswordAuthenticationToken(credential, password, Collections.emptyList());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return CustomUserAuthentication.class.isAssignableFrom(authentication);
    }
}
