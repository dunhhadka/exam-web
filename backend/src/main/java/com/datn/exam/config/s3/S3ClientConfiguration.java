package com.datn.exam.config.s3;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class S3ClientConfiguration {
    private final S3Configuration s3Config;

    private AwsCredentialsProvider getCredentialsProvider() {
        if (StringUtils.hasText(s3Config.getAccessKey())
                && StringUtils.hasText(s3Config.getSecretKey())) {
            return StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(s3Config.getAccessKey(), s3Config.getSecretKey()));
        }
        return DefaultCredentialsProvider.create();
    }

    @Bean
    public S3Client s3Client() {
        try {
            return S3Client.builder()
                    .region(Region.of(s3Config.getRegion()))
                    .endpointOverride(URI.create(s3Config.getBaseUrl()))
                    .credentialsProvider(getCredentialsProvider())
                    .forcePathStyle(true)
                    .build();
        } catch (Exception e) {
            log.error("Error creating S3Client: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .region(Region.of(s3Config.getRegion()))
                .endpointOverride(URI.create(s3Config.getBaseUrl()))
                .credentialsProvider(getCredentialsProvider())
                .serviceConfiguration(
                    software.amazon.awssdk.services.s3.S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build()
                )
                .build();
    }
}