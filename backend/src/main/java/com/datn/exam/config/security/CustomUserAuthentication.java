package com.datn.exam.config.security;

import lombok.Getter;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.*;

@Getter
public class CustomUserAuthentication extends UsernamePasswordAuthenticationToken {
    private final UUID userId;
    private final String token;
    private final List<String> roles;
    private final List<String> grantedPermissions;

    public CustomUserAuthentication(Object principal, Object credentials) {
        super(principal, credentials);
        this.userId = null;
        this.token = null;
        this.roles = Collections.emptyList();
        this.grantedPermissions = Collections.emptyList();
    }

    public CustomUserAuthentication(
            Object principal,
            Object credentials,
            UUID userId,
            String token,
            List<String> roles,
            List<String> permissions
    ) {
        super(principal, credentials, buildAuthorities(roles, permissions));

        this.userId = userId;
        this.token = token;
        this.roles = roles != null ? new ArrayList<>(roles) : Collections.emptyList();
        this.grantedPermissions = permissions != null ? new ArrayList<>(permissions) : Collections.emptyList();
    }

    private static Collection<GrantedAuthority> buildAuthorities(List<String> roles, List<String> permissions) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        if (roles != null) {
            roles.forEach(role -> authorities.add(new SimpleGrantedAuthority("ROLE_" + role)));
        }

        // Add permissions as-is (RESOURCE:ACTION format)
        if (permissions != null) {
            permissions.forEach(permission -> authorities.add(new SimpleGrantedAuthority(permission)));
        }

        return authorities;
    }

    public void setUserId(UUID userId) {
        throw new UnsupportedOperationException("Use constructor with full parameters instead");
    }

    public boolean hasRole(String role) {
        return roles.contains(role);
    }

    public boolean hasPermission(String permission) {
        return grantedPermissions.contains(permission);
    }
}
