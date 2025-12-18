package com.datn.exam.repository.projection;

import java.util.UUID;

public interface SessionUserProjection {
    UUID getUserId();

    Long getExamSessionId();
}
