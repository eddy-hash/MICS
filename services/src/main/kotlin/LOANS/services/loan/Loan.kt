package LOANS.services.loan

import LOANS.services.user.User
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "loans")
class Loan(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null,

    @Column(nullable = false, unique = true, length = 32)
    var reference: String = "",

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_id", nullable = false)
    var applicant: User? = null,

    @Column(nullable = false, precision = 15, scale = 2)
    var amount: BigDecimal = BigDecimal.ZERO,

    // Tanzania default. Change per loan if you expand markets.
    @Column(nullable = false, length = 3)
    var currency: String = "TZS",

    @Column(name = "term_months", nullable = false)
    var termMonths: Int = 12,

    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 4)
    var interestRate: BigDecimal = BigDecimal.ZERO,

    @Column(columnDefinition = "TEXT")
    var purpose: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var status: LoanStatus = LoanStatus.PENDING,

    @Column(name = "submitted_at", nullable = false)
    var submittedAt: Instant = Instant.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    var reviewedBy: User? = null,

    @Column(name = "reviewed_at")
    var reviewedAt: Instant? = null,

    @Column(name = "review_notes", columnDefinition = "TEXT")
    var reviewNotes: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    var approvedBy: User? = null,

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by")
    var rejectedBy: User? = null,

    @Column(name = "rejected_at")
    var rejectedAt: Instant? = null,

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    var rejectionReason: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disbursed_by")
    var disbursedBy: User? = null,

    @Column(name = "disbursed_at")
    var disbursedAt: Instant? = null,

    @Column(name = "disbursement_ref", length = 64)
    var disbursementRef: String? = null,

    @Column(name = "repaid_at")
    var repaidAt: Instant? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
