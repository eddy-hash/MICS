package LOANS.services.audit

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface AuditLogRepository : JpaRepository<AuditLog, UUID> {
    fun findAllByOrderByCreatedAtDesc(pageable: Pageable): Page<AuditLog>
    fun findByActorEmailOrderByCreatedAtDesc(email: String, pageable: Pageable): Page<AuditLog>
    fun findByActionOrderByCreatedAtDesc(action: String, pageable: Pageable): Page<AuditLog>
    fun findByResourceTypeAndResourceIdOrderByCreatedAtDesc(
        resourceType: String, resourceId: UUID, pageable: Pageable
    ): Page<AuditLog>
}
