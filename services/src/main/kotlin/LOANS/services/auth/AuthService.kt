package LOANS.services.auth

import LOANS.services.auth.dto.*
import LOANS.services.security.InvalidTokenException
import LOANS.services.security.RefreshTokenRepository
import LOANS.services.audit.AuditService
import LOANS.services.security.TooManyLoginAttemptsException
import LOANS.services.security.RateLimiter
import LOANS.services.security.TokenService
import LOANS.services.user.Role
import LOANS.services.user.User
import LOANS.services.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.util.UUID

@Service
class AuthService(
    private val users: UserRepository,
    private val tokens: TokenService,
    private val encoder: PasswordEncoder,
    private val resetTokens: PasswordResetTokenRepository,
    private val refreshTokens: RefreshTokenRepository,
    private val emailService: EmailService,
    private val rateLimiter: RateLimiter,
    private val audit: AuditService,
    @Value("\${app.jwt.access-ttl-minutes}") private val accessTtlMinutes: Long,
    @Value("\${app.frontend.reset-url}") private val resetUrlBase: String,
    @Value("\${app.password-reset.ttl-minutes:30}") private val resetTtlMinutes: Long
) {
    private val log = LoggerFactory.getLogger(javaClass)

    // ---------- REGISTER ----------

    @Transactional
    fun register(req: RegisterRequest, ip: String?, ua: String?): TokenResponse {
        if (users.existsByEmail(req.email.lowercase())) {
            throw IllegalArgumentException("Email already registered")
        }
        val user = User(
            email = req.email.lowercase().trim(),
            passwordHash = encoder.encode(req.password)!!,
            firstName = req.firstName.trim(),
            lastName = req.lastName.trim(),
            phone = req.phone?.trim()?.takeIf { it.isNotBlank() },
            roles = mutableSetOf(Role.LOANEE)
        )
        users.save(user)
        log.info("New user registered: {}", user.email)
        val pair = tokens.issuePair(user, ip, ua)
        return TokenResponse(pair.accessToken, pair.refreshToken, expires_in = accessTtlMinutes * 60)
    }

    // ---------- LOGIN ----------

    @Transactional
    fun login(email: String, password: String, ip: String?, userAgent: String?): TokenResponse {
        val normalized = email.lowercase().trim()
        val key = "${ip ?: "unknown"}|$normalized"
        rateLimiter.check(key)

        val user = users.findByEmail(normalized)
        if (user == null) {
            rateLimiter.recordFailure(key)
            audit.log(null, "LOGIN_FAILED", "user", null, mapOf("email" to normalized, "reason" to "unknown"))
            throw BadCredentialsException("Invalid credentials")
        }
        if (!user.enabled || user.locked) {
            rateLimiter.recordFailure(key)
            audit.log(normalized, "LOGIN_BLOCKED", "user", user.id, mapOf("reason" to if (user.locked) "locked" else "disabled"))
            throw BadCredentialsException("Invalid credentials")
        }
        if (!encoder.matches(password, user.passwordHash)) {
            rateLimiter.recordFailure(key)
            audit.log(normalized, "LOGIN_FAILED", "user", user.id, mapOf("reason" to "bad_password"))
            throw BadCredentialsException("Invalid credentials")
        }
        rateLimiter.clear(key)
        val pair = tokens.issuePair(user, ip, userAgent)
        audit.log(normalized, "LOGIN_SUCCESS", "user", user.id)
        log.info("User {} logged in", normalized)
        return TokenResponse(pair.accessToken, pair.refreshToken, expires_in = accessTtlMinutes * 60)
    }

    // ---------- REFRESH ----------

    @Transactional
    fun refresh(refreshToken: String, ip: String?, userAgent: String?): TokenResponse {
        val pair = try {
            tokens.rotate(refreshToken, ip, userAgent)
        } catch (e: InvalidTokenException) {
            log.warn("Refresh failed: {}", e.message)
            throw e
        }
        return TokenResponse(pair.accessToken, pair.refreshToken, expires_in = accessTtlMinutes * 60)
    }

    // ---------- PASSWORD RESET ----------

    @Transactional
    fun requestPasswordReset(email: String, ip: String?) {
        val user = users.findByEmail(email.lowercase().trim())
        // Always return success to prevent user enumeration
        if (user == null) {
            log.info("Password reset requested for unknown email: {}", email)
            return
        }
        resetTokens.invalidateAllForUser(user.id!!)

        val token = PasswordResetToken(
            user = user,
            expiresAt = Instant.now().plus(Duration.ofMinutes(resetTtlMinutes)),
            requestedByIp = ip
        )
        resetTokens.save(token)

        val resetUrl = "$resetUrlBase/${token.token}"
        emailService.sendPasswordReset(user.email, user.fullName, resetUrl)  // ← uses property, not param
        log.info("Password reset token generated for {}", user.email)
    }

    @Transactional
    fun confirmPasswordReset(rawToken: String, newPassword: String) {
        val uuid = try {
            UUID.fromString(rawToken)
        } catch (e: IllegalArgumentException) {
            throw InvalidTokenException("Malformed reset token")
        }
        val token = resetTokens.findByToken(uuid)
            ?: throw InvalidTokenException("Reset token not recognized")
        if (token.used) throw InvalidTokenException("Reset token already used")
        if (token.expiresAt.isBefore(Instant.now())) throw InvalidTokenException("Reset token expired")

        val user = token.user ?: throw InvalidTokenException("Reset token has no user")
        user.passwordHash = encoder.encode(newPassword)!!
        users.save(user)

        token.used = true
        token.usedAt = Instant.now()
        resetTokens.save(token)

        // Revoke all sessions — forces re-login everywhere
        refreshTokens.revokeAllForUser(user.id!!, Instant.now())
        log.info("Password reset completed for {}", user.email)
    }
}
