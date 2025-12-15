package com.datn.exam.repository.data;

import com.datn.exam.model.dto.request.ExamStudentFilterRequest;
import com.datn.exam.repository.data.dto.ExamSessionStudentDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Slf4j
@Repository
@RequiredArgsConstructor
public class SessionStudentJdbcTemplate {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    private final static String BASE_SQL = """
                SELECT
                    ss.id as id,
                    es.name as name,
                    es.code as join_token,
                    es.start_time,
                    es.end_time,
                    e.name as exam_name,
                    es.duration_minutes as duration,
                    ss.status
                FROM exam_sessions es
                INNER JOIN session_students ss ON es.id = ss.exam_session_id
                INNER JOIN users u ON ss.user_id = u.id
                INNER JOIN exams e ON es.exam_id = e.id
            """;

    public List<ExamSessionStudentDto> filter(
            Integer cursorId,
            UUID currentUserId,
            ExamStudentFilterRequest request,
            int fetchSize) {

        StringBuilder sql = new StringBuilder(BASE_SQL);
        var params = new MapSqlParameterSource();

        sql.append(" WHERE u.id = :user_id ");
        params.addValue("user_id", currentUserId.toString());

        sql.append(buildWhereClause(request, params));
        sql.append(buildCursorCondition(cursorId, params));

        sql.append(" ORDER BY ss.id DESC LIMIT :fetch_size ");

        params.addValue("fetch_size", fetchSize);

        log.debug("Executing SQL: {}", sql);
        log.debug("Parameters: {}", params.getValues());

        return jdbcTemplate.query(
                sql.toString(),
                params,
                BeanPropertyRowMapper.newInstance(ExamSessionStudentDto.class)
        );
    }

    private String buildCursorCondition(
            Integer cursorId,
            MapSqlParameterSource params) {

        if (cursorId != null && cursorId > 0) {
            params.addValue("cursor_id", cursorId);
            return " AND ss.id < :cursor_id ";
        }

        return "";
    }

    private String buildWhereClause(ExamStudentFilterRequest request, MapSqlParameterSource params) {
        StringBuilder clause = new StringBuilder();

        if (StringUtils.isNotBlank(request.getName())) {
            clause.append(" AND LOWER(es.name) LIKE LOWER(:name) ");
            params.addValue("name", "%" + request.getName().trim() + "%");
        }

        if (request.getStartTime() != null) {
            clause.append(" AND es.start_time >= :start_time ");
            params.addValue("start_time", request.getStartTime());
        }

        if (request.getEndTime() != null) {
            clause.append(" AND es.end_time <= :end_time ");
            params.addValue("end_time", request.getEndTime());
        }

        if (request.getStatus() != null) {
            clause.append(" AND ss.status = :status ");
            params.addValue("status", request.getStatus().name());
        }

        return clause.toString();
    }
}