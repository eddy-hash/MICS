package LOANS.services.security

import LOANS.services.rbac.RolePermissionsService
import LOANS.services.user.User
import io.jsonwebtoken.Claims
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.nio.charset.StandardCharsets
import java.time.Duration
import java.time.Instant
import java.util.Date
import java.util.UUID

class InvalidTokenException(message: String) : RuntimeException(message)

data class TokenPair(val accessToken: String, val refreshToken: String)

@Service
class TokenService(
    @Value("\${app.jwt.secret}") secret: String,
    @Value("\${app.jwt.access-ttl-minutes}") private val accessTtlMinutes: Long,
    @Value("\${app.jwt.refresh-ttl-days}") private val refreshTtlDays: Long,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val rolePermissions: RolePermissionsService
) {
    private val key = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))

    @Transactional
    fun issuePair(user: User, ip: String?, userAgent: String?): TokenPair {
        val access = buildAccess(user)
        val refresh = buildAndStoreRefresh(user, ip, userAgent)
        return TokenPair(access, refresh)
    }

    @Transactional
    fun rotate(refreshTokenJwt: String, ip: String?, userAgent: String?): TokenPair {
        val claims = parseClaims(refreshTokenJwt)
        val jti = try { UUID.fromString(claims.id) } catch (e: Exception) {
            throw InvalidTokenException("Malformed refresh token")
        }
        val stored = refreshTokenRepository.findByJti(jti)
            ?: throw InvalidTokenException("Refresh token not recognized")
        if (stored.revoked) {
            stored.user?.id?.let { refreshTokenRepository.revokeAllForUser(it, Instant.now()) }
            throw InvalidTokenException("Refresh token reuse detected — all sessions revoked")
        }
        if (stored.expiresAt.isBefore(Instant.now())) {
            throw InvalidTokenException("Refresh token expired")
        }
        val user = stored.user ?: throw InvalidTokenException("Refresh token has no user")
        stored.revoked = true
        stored.revokedAt = Instant.now()
        refreshTokenRepository.save(stored)

        val newPair = issuePair(user, ip, userAgent)
        val newJti = try { UUID.fromString(parseClaims(newPair.refreshToken).id) } catch (e: Exception) { null }
        if (newJti != null) {
            stored.replacedBy = newJti
            refreshTokenRepository.save(stored)
        }
        return newPair
    }

    fun buildAccess(user: User): String {
        val now = Date()
        val expires = Date(now.time + Duration.ofMinutes(accessTtlMinutes).toMillis())

        // Roles → ROLE_X strings (Spring Security hasRole() compatible)
        val roleAuthorities = user.roles.map { "ROLE_${it.name}" }

        // Permissions for those roles → e.g., "loan:approve"
        val permissionAuthorities = rolePermissions
            .permissionsForRoles(user.roles.map { it.name })

        // Merge, deduped. Endpoint checks use hasAuthority('X') for both kinds.
        val authorities = (roleAuthorities + permissionAuthorities).toSortedSet().toList()

        return Jwts.builder()
            .subject(user.email)
            .claim("uid", user.id.toString())
            .claim("roles", user.roles.map { it.name })
            .claim("authorities", authorities)
            .issuedAt(now)
            .expiration(expires)
            .signWith(key)
            .compact()
    }

    private fun buildAndStoreRefresh(user: User, ip: String?, userAgent: String?): String {
        val jti = UUID.randomUUID()
        val now = Instant.now()
        val expiresAt = now.plus(Duration.ofDays(refreshTtlDays))
        refreshTokenRepository.save(RefreshToken(
            jti = jti, user = user, expiresAt = expiresAt,
            issuedAt = now, ipAddress = ip, userAgent = userAgent
        ))
        return Jwts.builder()
            .id(jti.toString())
            .subject(user.email)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(key)
            .compact()
    }

    private fun parseClaims(token: String): Claims =
        try { Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload }
        catch (e: JwtException) { throw InvalidTokenException("Invalid or expired token: ${e.message}") }
}
