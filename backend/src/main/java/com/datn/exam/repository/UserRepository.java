package com.datn.exam.repository;

import com.datn.exam.model.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    @Query("SELECT u FROM User u WHERE u.deleted = FALSE AND u.id = :id")
    @NonNull
    Optional<User> findActiveById(@NonNull UUID id);

    @Query("SELECT u FROM User u WHERE u.deleted = FALSE AND u.email = :credential")
    Optional<User> findByCredential(String credential);

    @Query("SELECT u FROM User u WHERE u.deleted = FALSE AND u.accountType = 'SYSTEM' AND u.email = :email")
    Optional<User> findSystemByEmail(String email);

    @Query("""
             SELECT CASE WHEN COUNT(u) > 0 THEN TRUE ELSE FALSE END
                FROM User u
                JOIN u.userRoles ur
                JOIN ur.role r
                WHERE u.deleted = FALSE
                  AND r.deleted = FALSE
                  AND u.email = :email
                  AND r.code = 'TEACHER'
            """)
    boolean existsTeacherByEmail(String email);
}
