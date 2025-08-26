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
            if (requiredPermission.startsWith("ROLE_")) {
                return userAuthentication.getGrantedPermissions().contains(requiredPermission);
            }
            //NOTE: VD: "COURSE:READ"
            if (!requiredPermission.contains(":")) {
                return false;
            }

            String[] requiredParts = requiredPermission.split(":");
            if (requiredParts.length != 2) {
                return false;
            }

            String requiredResourceCode = requiredParts[0].toUpperCase();
            String requiredAction = requiredParts[1].toUpperCase();

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
