package com.datn.exam.repository.data.dao;

import com.datn.exam.repository.data.dto.QuestionTagDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class JdbcTagDao implements TagDao{
    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public List<QuestionTagDto> findTagByQuestionIds(List<Long> questionIds) {
        String sql = """
                SELECT
                    qt.question_id AS questionId,
                    t.id,
                    t.name,
                    t.slug,
                    t.color_code AS colorCode
                FROM question_tags qt
                JOIN tags t ON t.id = qt.tag_id
                WHERE qt.question_id IN (:ids)
                """;

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("ids", questionIds);

        return jdbcTemplate.query(sql, params, BeanPropertyRowMapper.newInstance(QuestionTagDto.class));
    }
}
