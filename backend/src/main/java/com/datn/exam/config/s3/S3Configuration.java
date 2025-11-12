package com.datn.exam.config.s3;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "aws.s3")
public class S3Configuration {
    private String accessKey;
    private String secretKey;
    private String bucketName;
    private String region;
    private int presignedUrlExpirationMinutes;
    private String baseUrl;
}
