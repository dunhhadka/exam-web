package com.datn.exam.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SessionTokenResponse {
    private String tokenJoinStart;
    private Long sessionId;
    private String sessionName;
    private String email;
}
