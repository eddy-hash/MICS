package LOANS.services.admin

import LOANS.services.admin.dto.UpdateRolesRequest
import LOANS.services.admin.dto.UpdateStatusRequest
import LOANS.services.admin.dto.UserSummary
import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/admin/users")
class UserAdminController(private val service: UserAdminService) {

    @GetMapping
    @PreAuthorize("hasAuthority('user:view:all')")
    fun list(): List<UserSummary> = service.listUsers()

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('user:manage:roles')")
    fun updateRoles(authentication: Authentication, @PathVariable id: UUID,
                    @Valid @RequestBody req: UpdateRolesRequest): UserSummary =
        service.updateRoles(authentication.name, id, req)

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('user:manage:status')")
    fun updateStatus(authentication: Authentication, @PathVariable id: UUID,
                     @Valid @RequestBody req: UpdateStatusRequest): UserSummary =
        service.updateStatus(authentication.name, id, req)
}
