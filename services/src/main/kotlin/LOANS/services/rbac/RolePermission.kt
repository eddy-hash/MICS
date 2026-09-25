package LOANS.services.rbac

import jakarta.persistence.*
import java.io.Serializable
import java.time.Instant

data class RolePermissionId(
    var role: String = "",
    var permission: String = ""
) : Serializable

@Entity
@Table(name = "role_permissions")
@IdClass(RolePermissionId::class)
class RolePermission(
    @Id
    @Column(nullable = false, length = 32)
    var role: String = "",

    @Id
    @Column(nullable = false, length = 64)
    var permission: String = "",

    @Column(name = "granted_at", nullable = false)
    var grantedAt: Instant = Instant.now()
)
