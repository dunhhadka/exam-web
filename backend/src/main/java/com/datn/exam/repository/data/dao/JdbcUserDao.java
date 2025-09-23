package com.datn.exam.repository.data.dao;

import com.datn.exam.repository.data.dto.UserDto;
import com.datn.exam.support.util.IdUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JdbcUserDao implements UserDao{
    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public UserDto getById(UUID id) {
        var sql = """
                SELECT\s
                    u.id,
                    u.email,
                    u.first_name as firstName,
                    u.last_name as lastName,
                    u.phone,
                    u.date_of_birth as dateOfBirth,
                    u.avatar_url as avatarUrl,
                    u.gender,
                    u.deleted
                FROM users u
                WHERE u.id = :id
                """;
        var params = new MapSqlParameterSource()
                .addValue("id", id.toString());

        var result = jdbcTemplate.query(sql, params, BeanPropertyRowMapper.newInstance(UserDto.class));
        return result.isEmpty() ? null : result.get(0);
    }

    @Override
    public List<UserDto> getUserByListId(List<UUID> ids) {
        return List.of();
    }
}
