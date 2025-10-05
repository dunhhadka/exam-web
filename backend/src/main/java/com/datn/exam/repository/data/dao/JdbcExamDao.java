package com.datn.exam.repository.data.dao;

import com.datn.exam.model.dto.request.ExamFilterRequest;
import com.datn.exam.repository.data.dto.ExamDto;
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
public class JdbcExamDao implements ExamDao{
    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public Long count(ExamFilterRequest request) {
        String sql = """
                SELECT
                    COUNT(DISTINCT e.id)
                FROM exams e
                WHERE 1 = 1 %s
                """;

        StringBuilder whereFilter = new StringBuilder();
        MapSqlParameterSource params = this.buildWhereConditions(request, whereFilter);

        String finalSql = String.format(sql, whereFilter.toString());

        return jdbcTemplate.queryForObject(finalSql, params, Long.class);
    }

    @Override
    public List<ExamDto> search(ExamFilterRequest request) {
        String sql = """
                SELECT
                    e.id,
                    e.name,
                    e.level,
                    e.status,
                    e.is_public AS publicFlag,
                    e.created_by AS createdBy,
                    e.created_at AS createdAt,
                    e.last_modified_at AS lastModifiedAt
                FROM exams e
                WHERE 1 = 1 %s
                ORDER BY e.created_at DESC
                LIMIT :limit OFFSET :offset
                """;

        StringBuilder whereFilter = new StringBuilder();
        MapSqlParameterSource params = this.buildWhereConditions(request, whereFilter);

        params.addValue("limit", request.getPageSize());
        params.addValue("offset", request.getPageSize() * request.getPageIndex());

        String finalSql = String.format(sql, whereFilter.toString());

        return jdbcTemplate.query(finalSql, params, BeanPropertyRowMapper.newInstance(ExamDto.class));
    }

    @Override
    public List<ExamDto> findByIds(List<Long> ids) {
        String sql = """
                SELECT
                e.id,
                e.name
                FROM exams AS e
                WHERE id IN (:ids)
                """;

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("ids", ids);

        return jdbcTemplate.query(sql, params, BeanPropertyRowMapper.newInstance(ExamDto.class));
    }


    private MapSqlParameterSource buildWhereConditions(ExamFilterRequest request, StringBuilder whereFilter) {
        MapSqlParameterSource params = new MapSqlParameterSource();

        if (StringUtils.isNotBlank(request.getKeyword())) {
            whereFilter.append(" AND LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) ");
            params.addValue("keyword", request.getKeyword());
        }

        if (request.getLevel() != null) {
            whereFilter.append(" AND e.level = :level ");
            params.addValue("level", request.getLevel().name());
        }

        if (request.getStatus() != null) {
            whereFilter.append(" AND e.status = :status ");
            params.addValue("status", request.getStatus().name());
        }

        if (request.getPublicFlag() != null) {
            whereFilter.append(" AND e.is_public = :isPublic ");
            params.addValue("isPublic", request.getPublicFlag());
        }

        return params;
    }
}
