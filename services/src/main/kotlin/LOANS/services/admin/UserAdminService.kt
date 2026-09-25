package LOANS.services.admin

import LOANS.services.admin.dto.UpdateRolesRequest
import LOANS.services.admin.dto.UpdateStatusRequest
import LOANS.services.admin.dto.UserSummary
import LOANS.services.audit.AuditService
import LOANS.services.notification.NotificationService
import LOANS.services.notification.NotificationType
import LOANS.services.security.RefreshTokenRepository
import LOANS.services.user.User
import LOANS.services.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

class UserNotFoundException(message: String) : RuntimeException(message)

@Service
class UserAdminService(
    private val users: UserRepository,
    private val refreshTokens: RefreshTokenRepository,
    private val notifications: NotificationService,
    private val audit: AuditService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional(readOnly = true)
    fun listUsers(): List<UserSummary> =
        users.findAll().map(::toSummary).sortedByDescending { it.createdAt }

    @Transactional
    fun updateRoles(actorEmail: String, id: UUID, req: UpdateRolesRequest): UserSummary {
        val user = users.findById(id).orElseThrow { UserNotFoundException("User $id not found") }
        require(req.roles.isNotEmpty()) { "User must have at least one role" }

        val before = user.roles.toSet()
        user.roles = req.roles.toMutableSet()
        users.save(user)

        if (before != req.roles) {
            refreshTokens.revokeAllForUser(user.id!!, Instant.now())
            notifications.notify(user, NotificationType.ROLE_CHANGED,
                "Your roles were updated",
                "New roles: ${req.roles.joinToString(", ")}. Please sign in again.",
                "user", user.id)
            audit.log(actorEmail, "ROLES_CHANGED", "user", user.id,
                mapOf("before" to before.map { it.name }, "after" to req.roles.map { it.name }))
            log.info("Roles changed for {}: {} → {}", user.email, before, req.roles)
        }
        return toSummary(user)
    }

    @Transactional
    fun updateStatus(actorEmail: String, id: UUID, req: UpdateStatusRequest): UserSummary {
        val user = users.findById(id).orElseThrow { UserNotFoundException("User $id not found") }
        if (req.enabled != null) user.enabled = req.enabled
        if (req.locked != null) user.locked = req.locked
        users.save(user)

        if (user.enabled.not() || user.locked) {
            refreshTokens.revokeAllForUser(user.id!!, Instant.now())
            val type = if (user.locked) NotificationType.ACCOUNT_LOCKED else NotificationType.ACCOUNT_DISABLED
            notifications.notify(user, type,
                if (user.locked) "Account locked" else "Account disabled",
                "Contact an administrator for details.",
                "user", user.id)
            audit.log(actorEmail, "ACCOUNT_STATUS_CHANGED", "user", user.id,
                mapOf("enabled" to user.enabled, "locked" to user.locked))
            log.info("User {} status changed — sessions revoked", user.email)
        }
        return toSummary(user)
    }

    private fun toSummary(u: User) = UserSummary(
        id = u.id!!, email = u.email, fullName = u.fullName, phone = u.phone,
        enabled = u.enabled, locked = u.locked, roles = u.roles.toSet(), createdAt = u.createdAt
    )
}
