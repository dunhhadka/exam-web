package com.datn.exam.repository.data.dao;


import com.datn.exam.repository.data.dto.UserDto;

import java.util.List;
import java.util.UUID;

public interface UserDao {
    UserDto getById(UUID id);
    List<UserDto> getUserByListId(List<UUID> ids);
}
