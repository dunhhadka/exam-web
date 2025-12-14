package com.datn.exam.repository.data;

import com.datn.exam.model.dto.request.ExamStudentFilterRequest;
import com.datn.exam.repository.data.dto.ExamSessionStudentDto;
import com.datn.exam.support.enums.SessionStudentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
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
                    es.id as exam_session_id,
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
                new ExamSessionStudentRowMapper()
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
            // Convert LocalDateTime to Timestamp
            params.addValue("start_time", Timestamp.valueOf(request.getStartTime()));
        }

        if (request.getEndTime() != null) {
            clause.append(" AND es.end_time <= :end_time ");
            // Convert LocalDateTime to Timestamp
            params.addValue("end_time", Timestamp.valueOf(request.getEndTime()));
        }

        if (request.getStatus() != null) {
            clause.append(" AND ss.status = :status ");
            params.addValue("status", request.getStatus().name());
        }

        return clause.toString();
    }

    // Custom RowMapper
    private static class ExamSessionStudentRowMapper implements RowMapper<ExamSessionStudentDto> {
        @Override
        public ExamSessionStudentDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            ExamSessionStudentDto dto = new ExamSessionStudentDto();
            dto.setId(rs.getInt("id"));
            dto.setName(rs.getString("name"));
            dto.setJoinToken(rs.getString("join_token"));
            dto.setExamSessionId(rs.getInt("exam_session_id"));

            Timestamp startTime = rs.getTimestamp("start_time");
            if (startTime != null) {
                dto.setStartTime(startTime.toLocalDateTime());
            }

            Timestamp endTime = rs.getTimestamp("end_time");
            if (endTime != null) {
                dto.setEndTime(endTime.toLocalDateTime());
            }

            dto.setExamName(rs.getString("exam_name"));
            dto.setDuration(rs.getInt("duration"));
            dto.setStatus(Optional.ofNullable(rs.getString("status")).map(SessionStudentStatus::valueOf).orElse(null));

            return dto;
        }
    }
}