package com.datn.exam.repository.data.dao;

import com.datn.exam.model.dto.request.QuestionSearchRequest;
import com.datn.exam.repository.data.dto.QuestionDto;
import com.datn.exam.repository.data.dto.TableChoiceValue;
import com.datn.exam.support.enums.QuestionType;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class JdbcQuestionDao implements QuestionDao{
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectMapper mapper;

    @Override
    public Long count(QuestionSearchRequest request) {
        String sql = """
                SELECT
                    COUNT(DISTINCT q.id)
                FROM questions q
                LEFT JOIN question_tags qt ON q.id = qt.question_id
                LEFT JOIN tags t ON qt.tag_id = t.id
                WHERE 1 = 1 %s
                """;

        StringBuilder whereFilter = new StringBuilder();
        MapSqlParameterSource params = this.buildWhereConditions(request, whereFilter);

        String finalSql = String.format(sql, whereFilter.toString());

        return jdbcTemplate.queryForObject(finalSql, params, Long.class);
    }

    @Override
    public List<QuestionDto> search(QuestionSearchRequest request) {
        String sql = """
                SELECT DISTINCT
                    q.id,
                    q.point,
                    q.text,
                    JSON_UNQUOTE(JSON_EXTRACT(q.question_value, '$.type'))  AS type,
                    JSON_UNQUOTE(JSON_EXTRACT(q.question_value, '$.level')) AS level,
                    JSON_UNQUOTE(JSON_EXTRACT(q.question_value, '$.status')) AS status,
                    JSON_UNQUOTE(JSON_EXTRACT(q.question_value,'$.public_flag')) AS publicFlag,
                    q.question_value AS questionValue,
                    q.created_at as createdAt,
                    q.created_by as createdBy,
                    q.last_modified_at as lastModifiedAt,
                    q.last_modified_by as lastModifiedBy
                FROM questions q
                LEFT JOIN question_tags qt ON qt.question_id = q.id
                LEFT JOIN tags t ON qt.tag_id = t.id
                WHERE 1 = 1 %s
                ORDER BY q.created_at DESC
                LIMIT :limit OFFSET :offset
                """;

        StringBuilder whereFilter = new StringBuilder();
        MapSqlParameterSource params = this.buildWhereConditions(request, whereFilter);

        params.addValue("limit", request.getPageSize());
        params.addValue("offset", request.getPageSize() * request.getPageIndex());

        String finalSql = String.format(sql, whereFilter.toString());

        List<QuestionDto> list = jdbcTemplate.query(finalSql, params, BeanPropertyRowMapper.newInstance(QuestionDto.class));

        list.forEach(this::mapTableChoiceFields);

        return list;
    }

    @Override
    public List<QuestionDto> findByIds(List<Long> ids) {
        String sql = """
                SELECT
                q.id,
                q.text,
                JSON_UNQUOTE(JSON_UNQUOTE(q.question_value, '$.type')) AS type,
                JSON_UNQUOTE(JSON_UNQUOTE(q.question_value, '$.level')) AS level,
                JSON_UNQUOTE(JSON_UNQUOTE(q.question_value, '$.status')) AS status
                JSON_UNQUOTE(JSON_UNQUOTE(q.question_value, '$.public_flag')) AS publicFlag
                FROM questions q
                WHERE q.id IN (:ids)
                """;

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("ids", ids);

        return jdbcTemplate.query(sql, params, BeanPropertyRowMapper.newInstance(QuestionDto.class));
    }

    private MapSqlParameterSource buildWhereConditions(QuestionSearchRequest request, StringBuilder whereFilter) {
        MapSqlParameterSource params = new MapSqlParameterSource();

        if (StringUtils.isNotBlank(request.getKeyword())) {
            whereFilter.append(" AND LOWER(q.text) LIKE LOWER(CONCAT('%', :keyword, '%')) ");
            params.addValue("keyword", request.getKeyword());
        }

        if (request.getType() != null) {
            whereFilter.append(" AND JSON_UNQUOTE(JSON_EXTRACT(q.question_value, '$.type')) = :type ");
            params.addValue("type", request.getType().name()); 
        }

        if (request.getLevel() != null) {
            whereFilter.append(" AND JSON_UNQUOTE(JSON_EXTRACT(q.question_value, '$.level')) = :level ");
            params.addValue("level", request.getLevel().name());
        }

        if (request.getStatus() != null) {
            whereFilter.append(" AND JSON_UNQUOTE(JSON_EXTRACT(q.question_value, '$.status')) = :status ");
            params.addValue("status", request.getStatus().name());
        }

        if (request.getPublicFlag() != null) {
            whereFilter.append(" AND JSON_UNQUOTE(JSON_EXTRACT(q.question_value, '$.public_flag')) = :isPublic ");
            params.addValue("isPublic", request.getPublicFlag());
        }

        if (StringUtils.isNotBlank(request.getTagName())) {
            whereFilter.append(" AND t.name = :tagName ");
            params.addValue("tagName", request.getTagName());
        }

        return params;
    }

    private void mapTableChoiceFields(QuestionDto dto) {
        if (dto.getType() == QuestionType.TABLE_CHOICE && dto.getQuestionValue() != null) {
            try {
                TableChoiceValue tv = mapper.readValue(dto.getQuestionValue(), TableChoiceValue.class);
                dto.setHeaders(tv.getHeaders());
                dto.setRows(tv.getRows());
            } catch (Exception ex) {
                log.warn("Failed to parse questionValue for questionId=" + dto.getId(), ex);
            }
        }
    }
}
