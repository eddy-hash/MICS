package LOANS.services.admin

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/dev/redis")
@ConditionalOnProperty(name = ["app.dev-tools.enabled"], havingValue = "true")
class RedisDebugController(private val redis: StringRedisTemplate) {

    @GetMapping("/ping")
    fun ping(): Map<String, Any> = try {
        redis.opsForValue().set("debug:ping", "pong-${System.currentTimeMillis()}")
        mapOf("ok" to true, "value" to (redis.opsForValue().get("debug:ping") ?: "nil"))
    } catch (e: Exception) {
        mapOf("ok" to false, "error" to (e.message ?: "unknown"))
    }

    @GetMapping("/keys")
    fun keys(): Map<String, Any> {
        val all = redis.keys("*") ?: emptySet()
        return mapOf("count" to all.size, "keys" to all.toList())
    }
}
