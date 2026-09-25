package LOANS.services.audit

import LOANS.services.common.RequestContext
import LOANS.services.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper
import java.util.UUID

@Service
class AuditService(
    private val auditLogs: AuditLogRepository,
    private val users: UserRepository,
    private val requestContext: RequestContext,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun log(
        actorEmail: String?,
        action: String,
        resourceType: String? = null,
        resourceId: UUID? = null,
        metadata: Map<String, Any?> = emptyMap()
    ) {
        try {
            val actor = actorEmail?.let { users.findByEmail(it) }
            val row = AuditLog(
                actor = actor,
                action = action,
                resourceType = resourceType,
                resourceId = resourceId,
                ipAddress = requestContext.ip(),
                userAgent = requestContext.userAgent(),
                metadata = if (metadata.isEmpty()) null else objectMapper.writeValueAsString(metadata)
            )
            auditLogs.save(row)
        } catch (e: Exception) {
            // Never let audit failures break business logic
            log.warn("Audit write failed for action={}: {}", action, e.message)
        }
    }
}
