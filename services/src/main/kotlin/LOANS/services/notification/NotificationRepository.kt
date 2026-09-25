package LOANS.services.notification

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

interface NotificationRepository : JpaRepository<Notification, UUID> {
    fun findByUserIdOrderByCreatedAtDesc(userId: UUID, pageable: Pageable): Page<Notification>
    fun findByUserIdAndReadOrderByCreatedAtDesc(userId: UUID, read: Boolean, pageable: Pageable): Page<Notification>
    fun countByUserIdAndRead(userId: UUID, read: Boolean): Long

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true, n.readAt = :now WHERE n.user.id = :userId AND n.read = false")
    fun markAllReadForUser(@Param("userId") userId: UUID, @Param("now") now: Instant): Int

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true, n.readAt = :now WHERE n.id = :id AND n.user.id = :userId")
    fun markRead(@Param("id") id: UUID, @Param("userId") userId: UUID, @Param("now") now: Instant): Int
}
