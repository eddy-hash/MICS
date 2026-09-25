package LOANS.services.rbac

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component
import java.time.Duration

/**
 * Redis-backed permission cache. Shared across backend instances;
 * invalidated centrally on RBAC updates. 10-minute TTL as safety net.
 */
@Component
@ConditionalOnProperty(name = ["app.redis.enabled"], havingValue = "true", matchIfMissing = false)
class RedisPermissionCache(
    private val redis: StringRedisTemplate,
) {
    private val ttl = Duration.ofMinutes(10)

    fun get(role: String): Set<String>? {
        val raw = redis.opsForValue().get("rbac:role:$role") ?: return null
        return if (raw.isBlank()) emptySet() else raw.split(',').toSet()
    }

    fun put(role: String, permissions: Set<String>) {
        redis.opsForValue().set("rbac:role:$role", permissions.joinToString(","), ttl)
    }

    fun invalidateAll() {
        val keys = redis.keys("rbac:role:*") ?: emptySet()
        if (keys.isNotEmpty()) redis.delete(keys)
    }

    fun invalidate(role: String) {
        redis.delete("rbac:role:$role")
    }
}
