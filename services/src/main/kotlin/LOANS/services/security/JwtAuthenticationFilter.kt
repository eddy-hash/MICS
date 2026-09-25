package LOANS.services.security

import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.nio.charset.StandardCharsets

@Component
class JwtAuthenticationFilter(
    @Value("\${app.jwt.secret}") secret: String
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(javaClass)
    private val key = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val header = request.getHeader("Authorization")
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response)
            return
        }

        val token = header.substring(7)
        try {
            val claims = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).payload

            val subject = claims.subject
            val userId = claims["uid"] as? String

            @Suppress("UNCHECKED_CAST")
            val authorityStrings = (claims["authorities"] as? List<String>) ?: emptyList()
            val authorities = authorityStrings.map { SimpleGrantedAuthority(it) }

            if (subject != null && SecurityContextHolder.getContext().authentication == null) {
                val auth = UsernamePasswordAuthenticationToken(subject, userId, authorities)
                auth.details = userId
                SecurityContextHolder.getContext().authentication = auth
            }
        } catch (e: JwtException) {
            log.debug("JWT rejected: {}", e.message)
        } catch (e: IllegalArgumentException) {
            log.warn("Malformed JWT: {}", e.message)
        }

        filterChain.doFilter(request, response)
    }
}
