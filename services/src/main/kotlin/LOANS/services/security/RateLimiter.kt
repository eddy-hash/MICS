package LOANS.services.security

/**
 * Common contract for rate limiters.
 *
 * Two implementations exist:
 *   - LoginRateLimiter    (in-memory, single instance)
 *   - RedisRateLimiter    (Redis-backed, shared across instances)
 *
 * AuthService depends on this interface so it doesn't care which
 * implementation is active. Spring wires the right one based on
 * app.redis.enabled.
 */
interface RateLimiter {
    fun check(key: String)
    fun recordFailure(key: String)
    fun clear(key: String)
}

class TooManyLoginAttemptsException(message: String) : RuntimeException(message)
