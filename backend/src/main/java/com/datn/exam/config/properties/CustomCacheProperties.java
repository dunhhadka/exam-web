package com.datn.exam.config.properties;

import lombok.Data;
import org.springframework.boot.autoconfigure.cache.CacheProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "custom.cache")
@Data
public class CustomCacheProperties {
    private Map<String, CacheProperties.Redis> customCache;


    @Data
    public static class CustomRedisCacheConfig {
        private Duration timeToLive;
        private Boolean cacheNullValues = true;
    }

}
