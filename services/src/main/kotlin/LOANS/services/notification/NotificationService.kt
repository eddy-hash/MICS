package LOANS.services.notification

import LOANS.services.user.User
import LOANS.services.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
class NotificationService(
    private val notifications: NotificationRepository,
    private val users: UserRepository
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun notify(
        user: User,
        type: NotificationType,
        title: String,
        body: String? = null,
        resourceType: String? = null,
        resourceId: UUID? = null
    ): Notification {
        val n = Notification(
            user = user,
            type = type,
            title = title,
            body = body,
            resourceType = resourceType,
            resourceId = resourceId
        )
        notifications.save(n)
        log.debug("Notification[{}] → {} | {}", type, user.email, title)
        return n
    }

    @Transactional(readOnly = true)
    fun list(email: String, unreadOnly: Boolean, pageable: Pageable): Page<Notification> {
        val user = users.findByEmail(email) ?: throw IllegalStateException("User not found")
        return if (unreadOnly) {
            notifications.findByUserIdAndReadOrderByCreatedAtDesc(user.id!!, false, pageable)
        } else {
            notifications.findByUserIdOrderByCreatedAtDesc(user.id!!, pageable)
        }
    }

    @Transactional(readOnly = true)
    fun unreadCount(email: String): Long {
        val user = users.findByEmail(email) ?: return 0
        return notifications.countByUserIdAndRead(user.id!!, false)
    }

    @Transactional
    fun markRead(email: String, id: UUID): Int {
        val user = users.findByEmail(email) ?: return 0
        return notifications.markRead(id, user.id!!, Instant.now())
    }

    @Transactional
    fun markAllRead(email: String): Int {
        val user = users.findByEmail(email) ?: return 0
        return notifications.markAllReadForUser(user.id!!, Instant.now())
    }
}
