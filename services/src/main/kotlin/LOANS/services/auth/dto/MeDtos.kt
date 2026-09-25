package LOANS.services.auth.dto

import LOANS.services.user.Role
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class ProfileResponse(
    val id: UUID,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phone: String?,
    val roles: Set<Role>,
    val enabled: Boolean,
    val locked: Boolean,
    val createdAt: Instant
)

data class UpdateProfileRequest(
    @field:NotBlank @field:Size(min = 1, max = 100) val firstName: String,
    @field:NotBlank @field:Size(min = 1, max = 100) val lastName: String,
    @field:Size(max = 32) val phone: String? = null
)

data class ChangePasswordRequest(
    @field:NotBlank val currentPassword: String,

    @field:NotBlank
    @field:Size(min = 12, max = 128)
    @field:Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Password must contain lowercase, uppercase, and a digit"
    )
    val newPassword: String
)
