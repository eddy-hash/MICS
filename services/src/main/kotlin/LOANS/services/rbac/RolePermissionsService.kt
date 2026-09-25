package LOANS.services.rbac

import LOANS.services.user.Role
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * In-memory cache of role→permission mappings.
 *
 * Rebuilt:
 *   - on first access (lazy)
 *   - on every admin change (updateRolePermissions)
 *
 * The map is swapped atomically via @Volatile, so concurrent readers
 * always see a consistent snapshot.
 */
@Service
class RolePermissionsService(
    private val repository: RolePermissionRepository,
    private val redisCache: RedisPermissionCache? = null,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Volatile
    private var cache: Map<String, Set<String>> = emptyMap()

    /**
     * Return all permissions granted to the given role names.
     * Roles are passed as their enum names (e.g., "OFFICER").
     */
    fun permissionsForRoles(roleNames: Collection<String>): Set<String> {
        if (roleNames.isEmpty()) return emptySet()

        // Redis first
        redisCache?.let { rc ->
            val collected = mutableSetOf<String>()
            var allHit = true
            for (role in roleNames) {
                val perms = rc.get(role)
                if (perms == null) { allHit = false; break }
                collected.addAll(perms)
            }
            if (allHit) return collected
        }

        // In-memory fallback
        val snapshot = cache.takeIf { it.isNotEmpty() } ?: rebuildAndGet()
        val result = roleNames.flatMapTo(mutableSetOf()) { snapshot[it] ?: emptySet() }

        // Populate Redis
        redisCache?.let { rc ->
            for (role in roleNames) snapshot[role]?.let { rc.put(role, it) }
        }
        return result
    }

    fun permissionsForRole(role: Role): Set<String> =
        permissionsForRoles(listOf(role.name))

    fun snapshot(): Map<String, Set<String>> {
        if (cache.isEmpty()) rebuildAndGet()
        return cache
    }

    @Transactional
    fun updateRolePermissions(role: Role, permissions: Set<Permission>) {
        repository.deleteByRole(role.name)
        val rows = permissions.map { RolePermission(role = role.name, permission = it.key) }
        if (rows.isNotEmpty()) repository.saveAll(rows)
        rebuildAndGet()
        log.info("Role {} permissions updated → {}", role, permissions.map { it.key })
    }

    @Synchronized
    private fun rebuildAndGet(): Map<String, Set<String>> {
        val rows = repository.findAll()
        val map = rows
            .groupBy({ it.role }, { it.permission })
            .mapValues { (_, perms) -> perms.toSet() }
        cache = map
        redisCache?.let { rc ->
            rc.invalidateAll()
            for ((role, perms) in map) rc.put(role, perms)
        }
        log.debug("RBAC cache rebuilt: {} roles", map.size)
        return map
    }
}
