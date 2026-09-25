package LOANS.services.rbac

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional

interface RolePermissionRepository : JpaRepository<RolePermission, RolePermissionId> {

    fun findByRole(role: String): List<RolePermission>

    @Query("SELECT rp FROM RolePermission rp WHERE rp.role IN :roles")
    fun findByRoleIn(@Param("roles") roles: Collection<String>): List<RolePermission>

    @Modifying
    @Transactional
    @Query("DELETE FROM RolePermission rp WHERE rp.role = :role")
    fun deleteByRole(@Param("role") role: String)

    fun countByRole(role: String): Long
}
