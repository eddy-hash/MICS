package LOANS.services.rbac

import LOANS.services.audit.AuditService
import LOANS.services.user.Role
import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/admin/rbac")
@PreAuthorize("hasAuthority('role:permission:manage')")
class RolePermissionController(
    private val service: RolePermissionsService,
    private val audit: AuditService
) {

    /** Full matrix — every permission + which roles hold it. */
    @GetMapping
    fun matrix(): RolePermissionsMatrix {
        val all = Permission.entries.map { it.key }
        val byRole = Role.entries.associateWith { role ->
            service.permissionsForRole(role)
        }
        return RolePermissionsMatrix(allPermissions = all, byRole = byRole)
    }

    /** Permissions for a single role. */
    @GetMapping("/{role}")
    fun forRole(@PathVariable role: Role): RolePermissionsResponse =
        RolePermissionsResponse(role = role, permissions = service.permissionsForRole(role))

    /** Replace the permission set for a role. */
    @PutMapping("/{role}")
    fun update(
        authentication: Authentication,
        @PathVariable role: Role,
        @Valid @RequestBody req: UpdateRolePermissionsRequest
    ): RolePermissionsResponse {
        val parsed = req.permissions.mapNotNull { Permission.fromKey(it) }.toSet()
        if (parsed.size != req.permissions.size) {
            val unknown = req.permissions - parsed.map { it.key }.toSet()
            throw IllegalArgumentException("Unknown permissions: $unknown")
        }
        // Guard: ADMINISTRATOR must keep role:permission:manage or nobody can edit RBAC again
        if (role == Role.ADMINISTRATOR && Permission.ROLE_PERMISSION_MANAGE !in parsed) {
            throw IllegalArgumentException(
                "ADMINISTRATOR must retain 'role:permission:manage'"
            )
        }

        service.updateRolePermissions(role, parsed)
        audit.log(authentication.name, "ROLE_PERMISSIONS_UPDATED", "role", null,
            mapOf("role" to role.name, "permissions" to parsed.map { it.key }))

        return RolePermissionsResponse(role = role, permissions = parsed.map { it.key }.toSet())
    }
}
