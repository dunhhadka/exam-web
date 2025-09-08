package com.datn.exam.config.security;

import com.datn.exam.config.properties.AuthenticationProperties;
import com.datn.exam.support.enums.TokenType;
import com.datn.exam.support.util.IdUtils;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TokenProvider {
    private final AuthenticationProperties authenticationProperties;

    public String buildToken(Authentication authentication, UUID userId, TokenType tokenType) {
        Date expiration = Date.from(Instant.now());
        String claim;

        switch (tokenType) {
            case ACCESS_TOKEN -> expiration = Date.from(Instant.now().plus(authenticationProperties.getAccessTokenExpiresIn()));
            case REFRESH_TOKEN -> expiration = Date.from(Instant.now().plus(authenticationProperties.getRefreshTokenExpiresIn()));
            case REFRESH_TOKEN_LONG -> expiration = Date.from(Instant.now().plus(authenticationProperties.getRefreshTokenLongExpiresIn()));
        }

        return Jwts.builder()
                .id(IdUtils.convertUUIDToString(userId))
                .subject(authentication.getName())
                .claim("token_type", tokenType.name())
                .signWith(secretKey())
                .issuedAt(Date.from(Instant.now()))
                .expiration(expiration)
                .compact();
    }

    public String extractSubject(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractUserId(String token) {
        return extractClaims(token).getId();
    }

    public Date extractIssuedAt(String token) {
        return extractClaims(token).getIssuedAt();
    }

    public Date extractExpiration(String token) {
        return extractClaims(token).getExpiration();
    }

    private SecretKey secretKey() {
        return Keys.hmacShaKeyFor(Base64.getDecoder().decode(authenticationProperties.getSecretKey()));
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
