package LOANS.services.loan

import LOANS.services.user.User
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "loan_status_history")
class LoanStatusHistory(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id", nullable = false)
    var loan: Loan? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 32)
    var fromStatus: LoanStatus? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 32)
    var toStatus: LoanStatus = LoanStatus.PENDING,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    var changedBy: User? = null,

    @Column(name = "changed_at", nullable = false)
    var changedAt: Instant = Instant.now(),

    @Column(columnDefinition = "TEXT")
    var notes: String? = null
)
