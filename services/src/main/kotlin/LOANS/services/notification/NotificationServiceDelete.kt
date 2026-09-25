package LOANS.services.notification

import LOANS.services.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Delete a notification — only if it belongs to the requesting user.
 * Never allows deleting another user's notification.
 */
@Service
class NotificationDeleteService(
    private val notifications: NotificationRepository,
    private val users: UserRepository,
) {
    @Transactional
    fun delete(email: String, id: UUID): Boolean {
        val user = users.findByEmail(email) ?: return false
        val notification = notifications.findById(id).orElse(null) ?: return false
        if (notification.user?.id != user.id) return false
        notifications.delete(notification)
        return true
    }
}
