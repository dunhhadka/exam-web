package com.datn.exam.repository;

import com.datn.exam.model.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    @Query("SELECT r FROM Role r WHERE r.deleted = FALSE AND r.id IN :ids")
    List<Role> findActiveByIds(List<UUID> ids);

    @Query("SELECT r FROM Role r WHERE r.deleted = FALSE AND r.code = :code")
    Optional<Role> findByCode(String code);

    @Query("SELECT r FROM Role r WHERE r.deleted = FALSE AND r.code IN :codes")
    List<Role> findAllByCodes(List<String> codes);
}
