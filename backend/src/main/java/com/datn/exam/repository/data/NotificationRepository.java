package com.datn.exam.repository.data;

import com.datn.exam.model.dto.response.NotificationStatistic;
import com.datn.exam.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    @Query("SELECT n FROM Notification n WHERE n.id = :notificationId AND n.isDeleted IS FALSE")
    Optional<Notification> findByIdAndNotDeleted(int notificationId);

    @Query("SELECT n FROM Notification n WHERE n.receiveId = :userId AND n.isRead IS FALSE AND n.isDeleted IS FALSE")
    List<Notification> findByReceiveIdAndIsReadFalseAndNotDeleted(String userId);

    @Query("SELECT n FROM Notification n WHERE n.receiveId = :userId AND n.isDeleted IS FALSE")
    List<Notification> findAllAndNotDeleted(String userId);

    @Query("""
                SELECT new com.datn.exam.model.dto.response.NotificationStatistic(
                    CAST(COUNT(n.id) as int)
                    , CAST(COALESCE(SUM (CASE WHEN n.isRead IS FALSE THEN 1 ELSE 0 END), 0) as int)
                )
                FROM Notification n
                WHERE n.receiveId = :userId
                AND n.isDeleted IS FALSE
            """)
    NotificationStatistic statistic(String userId);
}
