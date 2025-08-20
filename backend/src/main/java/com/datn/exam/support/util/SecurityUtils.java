package com.datn.exam.support.util;

import com.datn.exam.config.security.CustomUserAuthentication;
import com.datn.exam.support.enums.error.AuthorizationError;
import com.datn.exam.support.exception.ResponseException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class SecurityUtils {
    public static String getPrincipal(Authentication authentication) {
        if (Objects.isNull(authentication)) return null;

        if (authentication.getPrincipal() instanceof UserDetails) {
            return ((UserDetails)authentication.getPrincipal()).getUsername();
        } else {
            return authentication.getPrincipal().toString();
        }
    }

    public static Optional<String> getCurrentUser() {
        return Optional.ofNullable(getPrincipal(SecurityContextHolder.getContext().getAuthentication()));
    }

    public static UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (Objects.isNull(authentication)) {
            throw new ResponseException(AuthorizationError.ACCESS_DENIED);
        }

        if (!(authentication instanceof CustomUserAuthentication)) {
            throw new ResponseException(AuthorizationError.UNSUPPORTED_AUTHENTICATION);
        }

        UUID currentUserId = ((CustomUserAuthentication) authentication).getUserId();

        if (Objects.isNull(currentUserId)) {
            throw new ResponseException(AuthorizationError.ACCESS_DENIED);
        }

        return currentUserId;
    }
}
