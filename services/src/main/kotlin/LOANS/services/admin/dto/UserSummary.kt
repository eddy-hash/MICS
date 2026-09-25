package LOANS.services.admin.dto

import LOANS.services.user.Role
import java.time.Instant
import java.util.UUID

data class UserSummary(
    val id: UUID,
    val email: String,
    val fullName: String,
    val phone: String?,
    val enabled: Boolean,
    val locked: Boolean,
    val roles: Set<Role>,
    val createdAt: Instant
)

data class UpdateRolesRequest(
    val roles: Set<Role>
)

data class UpdateStatusRequest(
    val enabled: Boolean?,
    val locked: Boolean?
)
