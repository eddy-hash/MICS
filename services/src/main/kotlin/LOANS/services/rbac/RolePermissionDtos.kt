package LOANS.services.rbac

import LOANS.services.user.Role
import jakarta.validation.constraints.NotEmpty

data class RolePermissionsResponse(
    val role: Role,
    val permissions: Set<String>
)

data class RolePermissionsMatrix(
    val allPermissions: List<String>,
    val byRole: Map<Role, Set<String>>
)

data class UpdateRolePermissionsRequest(
    @field:NotEmpty
    val permissions: Set<String>
)
