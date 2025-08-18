package com.datn.exam.repository;

import com.datn.exam.model.entity.RolePrivilege;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RolePrivilegeRepository extends JpaRepository<RolePrivilege, UUID> {
    @Query("SELECT rp FROM RolePrivilege rp WHERE rp.deleted = FALSE AND rp.roleId IN :roleIds")
    List<RolePrivilege> findAllByRoleId(List<UUID> roleIds);

    @Query("SELECT r FROM Role r WHERE r.deleted = FALSE AND r.code IN :codes")
    List<RolePrivilege> findAllByCodes(List<String> codes);
}
