package LOANS.services.notification

import LOANS.services.user.User
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "notifications")
class Notification(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    var type: NotificationType = NotificationType.LOAN_SUBMITTED,

    @Column(nullable = false, length = 255)
    var title: String = "",

    @Column(columnDefinition = "TEXT")
    var body: String? = null,

    @Column(name = "resource_type", length = 64)
    var resourceType: String? = null,

    @Column(name = "resource_id")
    var resourceId: UUID? = null,

    @Column(nullable = false)
    var read: Boolean = false,

    @Column(name = "read_at")
    var readAt: Instant? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)
