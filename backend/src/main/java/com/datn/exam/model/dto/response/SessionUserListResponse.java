package com.datn.exam.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionUserListResponse {
    private List<SessionUserResponse> users;
    private Integer total;
    private Integer page;
    private Integer size;
}
