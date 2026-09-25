package LOANS.services.security

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component
import java.time.Duration

/**
 * Redis-backed sliding-window rate limiter.
 * Active only when app.redis.enabled=true.
 *
 * Shared across backend instances, survives restarts.
 */
@Component
@ConditionalOnProperty(name = ["app.redis.enabled"], havingValue = "true", matchIfMissing = false)
class RedisRateLimiter(
    private val redis: StringRedisTemplate,
    @Value("\${app.security.login.max-attempts:5}") private val maxAttempts: Long,
    @Value("\${app.security.login.window-minutes:15}") private val windowMinutes: Long,
) : RateLimiter {

    private val window = Duration.ofMinutes(windowMinutes)

    override fun check(key: String) {
        val redisKey = "login:failures:$key"
        val current = redis.opsForValue().get(redisKey)?.toLongOrNull() ?: 0L
        if (current >= maxAttempts) {
            val ttl = redis.getExpire(redisKey)
            val mins = if (ttl > 0) (ttl / 60).coerceAtLeast(1) else windowMinutes
            throw TooManyLoginAttemptsException(
                "Too many login attempts. Try again in $mins minute(s)."
            )
        }
    }

    override fun recordFailure(key: String) {
        val redisKey = "login:failures:$key"
        val newCount = redis.opsForValue().increment(redisKey) ?: 1L
        if (newCount == 1L) {
            redis.expire(redisKey, window)
        }
    }

    override fun clear(key: String) {
        redis.delete("login:failures:$key")
    }
}
