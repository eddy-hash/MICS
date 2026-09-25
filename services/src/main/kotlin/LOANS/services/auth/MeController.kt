package LOANS.services.auth

import LOANS.services.audit.AuditService
import LOANS.services.auth.dto.ChangePasswordRequest
import LOANS.services.auth.dto.ProfileResponse
import LOANS.services.auth.dto.UpdateProfileRequest
import LOANS.services.security.RefreshTokenRepository
import LOANS.services.user.UserRepository
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/me")
class MeController(
    private val users: UserRepository,
    private val encoder: PasswordEncoder,
    private val refreshTokens: RefreshTokenRepository,
    private val audit: AuditService
) {

    @GetMapping
    fun me(authentication: Authentication): ProfileResponse {
        val user = users.findByEmail(authentication.name)
            ?: throw IllegalStateException("Authenticated user missing")
        return toProfile(user.id!!, user.email)
    }

    @PutMapping
    @Transactional
    fun updateProfile(
        authentication: Authentication,
        @Valid @RequestBody req: UpdateProfileRequest
    ): ProfileResponse {
        val user = users.findByEmail(authentication.name)!!
        user.firstName = req.firstName.trim()
        user.lastName = req.lastName.trim()
        user.phone = req.phone?.trim()?.takeIf { it.isNotBlank() }
        users.save(user)
        audit.log(authentication.name, "PROFILE_UPDATED", "user", user.id)
        return toProfile(user.id!!, user.email)
    }

    @PutMapping("/password")
    @Transactional
    fun changePassword(
        authentication: Authentication,
        @Valid @RequestBody req: ChangePasswordRequest
    ): ResponseEntity<Any> {
        val user = users.findByEmail(authentication.name)!!
        if (!encoder.matches(req.currentPassword, user.passwordHash)) {
            return ResponseEntity.badRequest().body(mapOf("message" to "Current password is incorrect"))
        }
        user.passwordHash = encoder.encode(req.newPassword)!!
        users.save(user)

        // Revoke all sessions to force re-login everywhere
        refreshTokens.revokeAllForUser(user.id!!, Instant.now())
        audit.log(authentication.name, "PASSWORD_CHANGED", "user", user.id)
        return ResponseEntity.ok(mapOf("ok" to true))
    }

    private fun toProfile(id: java.util.UUID, email: String): ProfileResponse {
        val u = users.findById(id).orElseThrow()
        return ProfileResponse(
            id = u.id!!,
            email = u.email,
            firstName = u.firstName,
            lastName = u.lastName,
            phone = u.phone,
            roles = u.roles.toSet(),
            enabled = u.enabled,
            locked = u.locked,
            createdAt = u.createdAt
        )
    }
}
