package com.datn.exam.repository.data.dao;

import com.datn.exam.model.dto.request.ExamSessionFilterRequest;
import com.datn.exam.repository.data.dto.ExamSessionDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
@Slf4j
public class JdbcExamSessionDao implements ExamSessionDao {
    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public Long count(ExamSessionFilterRequest request) {
        String sql = """
                SELECT
                    COUNT(DISTINCT es.id)
                FROM exam_sessions es
                WHERE 1 = 1 %s
                """;

        StringBuilder whereFilter = new StringBuilder();
        MapSqlParameterSource params = this.buildWhereConditions(request, whereFilter);

        String finalSql = String.format(sql, whereFilter.toString());

        return jdbcTemplate.queryForObject(finalSql, params, Long.class);
    }

    @Override
    public List<ExamSessionDto> search(ExamSessionFilterRequest request) {
        String sql = """
                SELECT
                    es.id,
                    es.name AS examSessionName,
                    e.name AS examName,
                    es.is_public AS public,
                    es.start_time AS startTime,
                    es.end_time AS endTime,
                    e.score,
                    es.duration_minutes AS durationMinutes
                FROM exam_sessions es
                LEFT JOIN exams e ON es.exam_id = e.id
                WHERE 1= 1 %s
                ORDER BY es.created_at DESC
                LIMIT :limit OFFSET :offset
                """;

        StringBuilder wheFilter = new StringBuilder();
        MapSqlParameterSource params = this.buildWhereConditions(request, wheFilter);

        params.addValue("limit", request.getPageSize());
        params.addValue("offset", request.getPageSize() * request.getPageIndex());

        String finalSql = String.format(sql, wheFilter.toString());

        return jdbcTemplate.query(finalSql, params, BeanPropertyRowMapper.newInstance(ExamSessionDto.class));
    }

    private MapSqlParameterSource buildWhereConditions(ExamSessionFilterRequest request, StringBuilder whereFilter) {
        MapSqlParameterSource params = new MapSqlParameterSource();

        if (StringUtils.isNotBlank(request.getKeyword())) {
            whereFilter.append(" AND LOWER(es.name) LIKE LOWER(CONCAT('%', :keyword, '%')) ");
            params.addValue("keyword", request.getKeyword());
        }

        if (request.getPublicFlag() != null) {
            whereFilter.append(" AND es.is_public = :isPublic ");
            params.addValue("isPublic", request.getPublicFlag());
        }

        if (request.getStartDate() != null) {
            whereFilter.append(" AND es.start_time >= :startDate ");
            params.addValue("startDate", request.getStartDate().atStartOfDay());
        }

        if (request.getEndDate() != null) {
            whereFilter.append(" AND es.start_time < :endDate ");
            params.addValue("endDate", request.getEndDate().plusDays(1).atStartOfDay());
        }

        return params;
    }
}
