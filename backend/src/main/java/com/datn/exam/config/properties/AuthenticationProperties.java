package com.datn.exam.config.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@ConfigurationProperties(prefix = "security.authentication.jwt")
@Data
public class AuthenticationProperties {
    private String secretKey;
    private Duration accessTokenExpiresIn = Duration.ofHours(1);
    private Duration refreshTokenExpiresIn = Duration.ofDays(1);
    private Duration refreshTokenLongExpiresIn = Duration.ofDays(30);
}
