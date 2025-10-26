package com.datn.exam.config.redis;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisConnectionTest implements CommandLineRunner {
    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    public void run(String... args) {
        try {
            redisTemplate.opsForValue().set("test:key", "Redis OK!");
            String value = redisTemplate.opsForValue().get("test:key");
            System.out.println("Redis connected successfully! Value = " + value);
        } catch (Exception e) {
            System.err.println("Redis connection failed: " + e.getMessage());
        }
    }
}
