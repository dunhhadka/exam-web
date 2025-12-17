package com.datn.exam.service;

import com.datn.exam.model.dto.request.ExamStudentFilterRequest;
import com.datn.exam.model.dto.response.CursorResponse;
import com.datn.exam.model.dto.response.ExamSessionStudentResponse;
import com.datn.exam.repository.data.SessionStudentJdbcTemplate;
import com.datn.exam.repository.data.dto.ExamSessionStudentDto;
import com.datn.exam.support.util.CursorCodeUtils;
import com.datn.exam.support.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamSessionReadService {

    private final SessionStudentJdbcTemplate jdbcTemplate;

    public CursorResponse<ExamSessionStudentResponse> filter(ExamStudentFilterRequest request) {

        var currentUserId = SecurityUtils.getCurrentUserId();

        int limit = request.getLimit();

        Integer cursorId = null;
        if (StringUtils.isNotBlank(request.getCursor())) {
            var decoded = CursorCodeUtils.decode(request.getCursor());
            cursorId = Integer.parseInt((String) decoded.get("id"));
        }

        int fetchSize = limit + 1;

        List<ExamSessionStudentDto> filterResult = jdbcTemplate.filter(
                cursorId, currentUserId,
                request, fetchSize
        );

        boolean hasNext = filterResult.size() > limit;
        if (hasNext) {
            filterResult = filterResult.subList(0, limit);
        }

        boolean hasPrevious = request.getCursor() != null;

        String nextCursor = null;
        if (hasNext && !filterResult.isEmpty()) {
            var lastSession = filterResult.get(filterResult.size() - 1);
            nextCursor = CursorCodeUtils.encode(lastSession.getId());
        }

        String previousCursor = request.getCursor();

        return CursorResponse.<ExamSessionStudentResponse>builder()
                .data(toResponse(filterResult))
                .nextCursor(nextCursor)
                .previousCursor(previousCursor)
                .hasNext(hasNext)
                .hasPrevious(hasPrevious)
                .pageSize(limit)
                .build();
    }

    private List<ExamSessionStudentResponse> toResponse(List<ExamSessionStudentDto> filterResult) {
        if (filterResult.isEmpty()) {
            return List.of();
        }

        return filterResult.stream()
                .map(this::buildResponse)
                .toList();
    }

    private ExamSessionStudentResponse buildResponse(ExamSessionStudentDto result) {
        return ExamSessionStudentResponse.builder()
                .id(result.getId())
                .name(result.getName())
                .joinToken(result.getJoinToken())
                .startTime(result.getStartTime())
                .endTime(result.getEndTime())
                .examName(result.getExamName())
                .duration(result.getDuration())
                .status(result.getStatus())
                .examSessionId(result.getExamSessionId())
                .description("Mô tả bài kiểm tra")
                .build();
    }
}
