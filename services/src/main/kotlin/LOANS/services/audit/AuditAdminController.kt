package LOANS.services.audit

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/admin/audit")
@PreAuthorize("hasAuthority('audit:view')")
class AuditAdminController(private val repository: AuditLogRepository) {

    @GetMapping
    fun list(@PageableDefault(size = 50) pageable: Pageable): Page<AuditLog> =
        repository.findAllByOrderByCreatedAtDesc(pageable)

    @GetMapping("/by-actor")
    fun byActor(@RequestParam email: String, @PageableDefault(size = 50) pageable: Pageable): Page<AuditLog> =
        repository.findByActorEmailOrderByCreatedAtDesc(email, pageable)

    @GetMapping("/by-action")
    fun byAction(@RequestParam action: String, @PageableDefault(size = 50) pageable: Pageable): Page<AuditLog> =
        repository.findByActionOrderByCreatedAtDesc(action, pageable)

    @GetMapping("/by-resource")
    fun byResource(@RequestParam type: String, @RequestParam id: UUID,
                   @PageableDefault(size = 50) pageable: Pageable): Page<AuditLog> =
        repository.findByResourceTypeAndResourceIdOrderByCreatedAtDesc(type, id, pageable)
}
