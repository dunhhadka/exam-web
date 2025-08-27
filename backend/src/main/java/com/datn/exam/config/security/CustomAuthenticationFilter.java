package com.datn.exam.config.security;

import com.datn.exam.model.dto.UserAuthority;
import com.datn.exam.service.AuthenticationService;
import com.datn.exam.support.enums.error.AuthenticationError;
import com.datn.exam.support.exception.ResponseException;
import com.datn.exam.support.util.IdUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationFilter extends OncePerRequestFilter {
    private final TokenProvider tokenProvider;
    private final AuthenticationService authenticationService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String token = extractBearerToken(request);

        if (Objects.isNull(token) || !isValidToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        //TODO: Check revoke token from cache
        UUID userId = IdUtils.convertStringToUUID(tokenProvider.extractUserId(token));

        if (Objects.isNull(userId)) throw new ResponseException(AuthenticationError.INVALID_AUTHENTICATION_TOKEN);

        UserAuthority userAuthority = authenticationService.getUserAuthority(userId);

        List<String> roles = extractRoles(userAuthority.grantedPrivileges());
        List<String> permissions = extractPermissions(userAuthority.grantedPrivileges());

        List<SimpleGrantedAuthority> grantedAuthorities = buildCombinedAuthorities(roles, permissions);

        User principal = new User(userAuthority.email(), "", grantedAuthorities);

        CustomUserAuthentication authentication = new CustomUserAuthentication(
                principal,
                "",
                userId,
                token,
                roles,
                permissions
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }

    private List<SimpleGrantedAuthority> buildCombinedAuthorities(List<String> roles, List<String> permissions) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        roles.forEach(role -> authorities.add(new SimpleGrantedAuthority("ROLE_" + role)));

        permissions.forEach(permission -> authorities.add(new SimpleGrantedAuthority(permission)));

        return authorities;
    }

    private List<String> extractRoles(List<String> grantedPrivileges) {
        return grantedPrivileges.stream()
                .filter(privilege -> privilege.startsWith("ROLE_"))
                .map(role -> role.substring(5))
                .toList();
    }

    private List<String> extractPermissions(List<String> grantedPrivileges) {
        return grantedPrivileges.stream()
                .filter(privilege -> privilege.contains(":"))
                .toList();
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (Objects.nonNull(authorizationHeader) && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }

        return null;
    }

    public boolean isValidToken(String token) {
        Date issuedAt = tokenProvider.extractIssuedAt(token);
        Date expiration = tokenProvider.extractExpiration(token);

        if (Objects.isNull(issuedAt)) return false;

        return !Objects.isNull(expiration) && !expiration.before(Date.from(Instant.now()));
    }
}
