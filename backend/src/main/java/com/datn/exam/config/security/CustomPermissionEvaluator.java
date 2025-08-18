package com.datn.exam.config.security;

import com.datn.exam.support.enums.error.AuthorizationError;
import com.datn.exam.support.exception.ResponseException;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;

import java.io.Serializable;
import java.util.Objects;

public class CustomPermissionEvaluator implements PermissionEvaluator {
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        String requiredPermission = (String) permission;

        if (authentication instanceof CustomUserAuthentication userAuthentication) {
            String requiredResourceCode = requiredPermission.split(":")[0].toUpperCase();
            String requiredAction = requiredPermission.split(":")[1].toUpperCase();

            return userAuthentication.getGrantedPermissions().stream()
                    .anyMatch(userPermission -> {
                        String resourceCode = userPermission.split(":")[0].toUpperCase();
                        String action = userPermission.split(":")[1].toUpperCase();

                        return Objects.equals(resourceCode, requiredResourceCode) && Objects.equals(action, requiredAction)
                                || Objects.equals(resourceCode, "ALL") && Objects.equals(action, requiredAction)
                                || Objects.equals(resourceCode, requiredResourceCode) && Objects.equals(action, "MANAGE")
                                || Objects.equals(resourceCode, "ALL") && Objects.equals(action, "MANAGE");

                    });
        } else {
            throw new ResponseException(AuthorizationError.UNSUPPORTED_AUTHENTICATION);
        }
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        return false;
    }
}
