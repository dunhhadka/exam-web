package com.datn.exam.repository;

import com.datn.exam.model.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    @Query("SELECT ur FROM UserRole ur WHERE ur.deleted = FALSE AND ur.user.id = :userId")
    List<UserRole> findByUser(UUID userId);
}
