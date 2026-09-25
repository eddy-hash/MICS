package LOANS.services.audit

import LOANS.services.user.User
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "audit_log")
class AuditLog(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    var actor: User? = null,

    @Column(nullable = false, length = 64)
    var action: String = "",

    @Column(name = "resource_type", length = 64)
    var resourceType: String? = null,

    @Column(name = "resource_id")
    var resourceId: UUID? = null,

    @Column(name = "ip_address", length = 64)
    var ipAddress: String? = null,

    @Column(name = "user_agent", length = 512)
    var userAgent: String? = null,

    @Column(columnDefinition = "TEXT")
    var metadata: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)
