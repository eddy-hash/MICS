package LOANS.services.security

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

/**
 * In-memory sliding-window rate limiter.
 * Active only when app.redis.enabled is NOT true (i.e., Redis is disabled).
 *
 * Note: does NOT survive backend restarts and does NOT share state
 * across multiple backend instances. Use RedisRateLimiter for production.
 */
@Component
@ConditionalOnProperty(name = ["app.redis.enabled"], havingValue = "false", matchIfMissing = true)
class LoginRateLimiter : RateLimiter {

    private data class Bucket(var count: Int, var resetAt: Instant)

    private val buckets = ConcurrentHashMap<String, Bucket>()

    @Value("\${app.security.login.max-attempts:5}")
    private var maxAttempts: Int = 5

    @Value("\${app.security.login.window-minutes:15}")
    private var windowMinutes: Long = 15

    override fun check(key: String) {
        val now = Instant.now()
        val b = buckets[key] ?: return
        if (b.resetAt.isBefore(now)) {
            buckets.remove(key)
            return
        }
        if (b.count >= maxAttempts) {
            val remaining = Duration.between(now, b.resetAt).toMinutes().coerceAtLeast(1)
            throw TooManyLoginAttemptsException(
                "Too many login attempts. Try again in $remaining minute(s)."
            )
        }
    }

    override fun recordFailure(key: String) {
        val now = Instant.now()
        buckets.compute(key) { _, existing ->
            when {
                existing == null || existing.resetAt.isBefore(now) ->
                    Bucket(1, now.plus(Duration.ofMinutes(windowMinutes)))
                else -> existing.also { it.count += 1 }
            }
        }
    }

    override fun clear(key: String) {
        buckets.remove(key)
    }
}
