package com.datn.exam.config.application;

import com.datn.exam.support.util.SecurityUtils;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CustomAuditorAware implements AuditorAware<String> {

    @NonNull
    @Override
    public Optional<String> getCurrentAuditor() {
        return SecurityUtils.getCurrentUser()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .or(() -> Optional.of("system")); // or Optional.empty()
    }
}
