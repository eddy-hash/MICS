package LOANS.services.loan

import LOANS.services.audit.AuditService
import LOANS.services.loan.dto.*
import LOANS.services.notification.NotificationService
import LOANS.services.notification.NotificationType
import LOANS.services.user.User
import LOANS.services.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Service
class LoanService(
    private val loans: LoanRepository,
    private val users: UserRepository,
    private val history: LoanStatusHistoryRepository,
    private val refGen: LoanReferenceGenerator,
    private val notifications: NotificationService,
    private val audit: AuditService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun createLoan(email: String, req: CreateLoanRequest): LoanResponse {
        val applicant = users.findByEmail(email)
            ?: throw IllegalStateException("Authenticated user not found")

        // ── One active loan at a time ──
        val activeStatuses = listOf(
            LoanStatus.PENDING,
            LoanStatus.UNDER_REVIEW,
            LoanStatus.APPROVED,
            LoanStatus.DISBURSED
        )
        val existing = loans
            .findByApplicantId(applicant.id!!, org.springframework.data.domain.Pageable.unpaged())
            .content
            .firstOrNull { it.status in activeStatuses }

        if (existing != null) {
            throw IllegalLoanTransitionException(
                "You already have an active loan (${existing.reference} — ${existing.status}). " +
                "Please wait until it is completed before applying for another."
            )
        }

        val loan = Loan(
            reference = uniqueReference(),
            applicant = applicant,
            amount = req.amount,
            currency = req.currency.uppercase(),  // "TZS" default
            termMonths = req.termMonths,
            interestRate = req.interestRate,
            purpose = req.purpose,
            status = LoanStatus.PENDING
        )
        val saved = loans.save(loan)
        recordHistory(saved, null, LoanStatus.PENDING, applicant, "Application submitted")

        notifications.notify(
            applicant,
            NotificationType.LOAN_SUBMITTED,
            "Loan application submitted",
            "Your application ${saved.reference} for ${saved.currency} ${saved.amount} is pending review.",
            "loan", saved.id
        )
        audit.log(email, "LOAN_SUBMITTED", "loan", saved.id,
            mapOf("reference" to saved.reference, "amount" to saved.amount))
        log.info("Loan {} created by {}", saved.reference, email)
        return toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun myLoans(email: String, pageable: Pageable): Page<LoanResponse> {
        val user = users.findByEmail(email) ?: throw IllegalStateException("User not found")
        return loans.findByApplicantId(user.id!!, pageable).map(::toResponse)
    }

    @Transactional(readOnly = true)
    fun pendingLoans(pageable: Pageable): Page<LoanResponse> =
        loans.findByStatusIn(listOf(LoanStatus.PENDING, LoanStatus.UNDER_REVIEW), pageable).map(::toResponse)

    @Transactional(readOnly = true)
    fun getLoan(id: UUID, requesterEmail: String, isStaff: Boolean): LoanDetailResponse {
        val loan = loans.findById(id).orElseThrow { LoanNotFoundException("Loan $id not found") }
        val requester = users.findByEmail(requesterEmail) ?: throw IllegalStateException("User not found")
        val isOwner = loan.applicant?.id == requester.id
        if (!isOwner && !isStaff) {
            throw org.springframework.security.access.AccessDeniedException("Not your loan")
        }
        val entries = history.findByLoanIdOrderByChangedAtAsc(id).map {
            LoanHistoryEntry(it.fromStatus, it.toStatus, it.changedBy?.fullName, it.changedAt, it.notes)
        }
        return LoanDetailResponse(toResponse(loan), entries)
    }

    @Transactional(readOnly = true)
    fun analyticsSummary(): LoanAnalyticsSummary {
        val all = loans.findAll()
        fun count(s: LoanStatus) = all.count { it.status == s }.toLong()
        val disbursedAmount = all
            .filter { it.status == LoanStatus.DISBURSED || it.status == LoanStatus.REPAID }
            .fold(BigDecimal.ZERO) { acc, l -> acc + l.amount }
        val pendingAmount = all
            .filter { it.status == LoanStatus.PENDING || it.status == LoanStatus.UNDER_REVIEW }
            .fold(BigDecimal.ZERO) { acc, l -> acc + l.amount }
        // Base currency for analytics — TZS for the Tanzanian market.
        // If you add multi-currency support, replace with per-currency aggregation.
        val baseCurrency = all.firstOrNull()?.currency ?: "TZS"
        return LoanAnalyticsSummary(
            totalLoans = all.size.toLong(),
            pendingCount = count(LoanStatus.PENDING) + count(LoanStatus.UNDER_REVIEW),
            approvedCount = count(LoanStatus.APPROVED),
            disbursedCount = count(LoanStatus.DISBURSED) + count(LoanStatus.REPAID),
            rejectedCount = count(LoanStatus.REJECTED),
            totalDisbursedAmount = disbursedAmount,
            totalPendingAmount = pendingAmount,
            currency = baseCurrency
        )
    }

    // -------- transitions --------

    @Transactional
    fun reviewLoan(id: UUID, email: String, req: ReviewLoanRequest): LoanResponse {
        val loan = requireLoan(id); val officer = requireUser(email); ensureNotFinal(loan)
        if (loan.status != LoanStatus.PENDING) throw IllegalLoanTransitionException("Only PENDING loans can move to UNDER_REVIEW")
        val from = loan.status
        loan.status = LoanStatus.UNDER_REVIEW
        loan.reviewedBy = officer
        loan.reviewedAt = Instant.now()
        loan.reviewNotes = req.notes
        loans.save(loan)
        recordHistory(loan, from, LoanStatus.UNDER_REVIEW, officer, req.notes)

        loan.applicant?.let {
            notifications.notify(it, NotificationType.LOAN_UNDER_REVIEW,
                "Loan under review",
                "Your application ${loan.reference} is now being reviewed.",
                "loan", loan.id)
        }
        audit.log(email, "LOAN_UNDER_REVIEW", "loan", loan.id)
        return toResponse(loan)
    }

    @Transactional
    fun approveLoan(id: UUID, email: String, req: ReviewLoanRequest): LoanResponse {
        val loan = requireLoan(id); val officer = requireUser(email); ensureNotFinal(loan)
        if (loan.status !in listOf(LoanStatus.PENDING, LoanStatus.UNDER_REVIEW))
            throw IllegalLoanTransitionException("Only PENDING or UNDER_REVIEW loans can be approved")
        val from = loan.status
        loan.status = LoanStatus.APPROVED
        loan.approvedBy = officer
        loan.approvedAt = Instant.now()
        loan.reviewNotes = req.notes ?: loan.reviewNotes
        loans.save(loan)
        recordHistory(loan, from, LoanStatus.APPROVED, officer, req.notes)

        loan.applicant?.let {
            notifications.notify(it, NotificationType.LOAN_APPROVED,
                "Loan approved",
                "Your application ${loan.reference} has been approved. Awaiting disbursement.",
                "loan", loan.id)
        }
        audit.log(email, "LOAN_APPROVED", "loan", loan.id, mapOf("amount" to loan.amount))
        log.info("Loan {} approved by {}", loan.reference, email)
        return toResponse(loan)
    }

    @Transactional
    fun rejectLoan(id: UUID, email: String, req: RejectLoanRequest): LoanResponse {
        val loan = requireLoan(id); val officer = requireUser(email); ensureNotFinal(loan)
        if (loan.status !in listOf(LoanStatus.PENDING, LoanStatus.UNDER_REVIEW))
            throw IllegalLoanTransitionException("Only PENDING or UNDER_REVIEW loans can be rejected")
        val from = loan.status
        loan.status = LoanStatus.REJECTED
        loan.rejectedBy = officer
        loan.rejectedAt = Instant.now()
        loan.rejectionReason = req.reason
        loans.save(loan)
        recordHistory(loan, from, LoanStatus.REJECTED, officer, req.reason)

        loan.applicant?.let {
            notifications.notify(it, NotificationType.LOAN_REJECTED,
                "Loan rejected",
                "Your application ${loan.reference} was rejected. Reason: ${req.reason}",
                "loan", loan.id)
        }
        audit.log(email, "LOAN_REJECTED", "loan", loan.id, mapOf("reason" to req.reason))
        return toResponse(loan)
    }

    @Transactional
    fun disburseLoan(id: UUID, email: String, req: DisburseLoanRequest): LoanResponse {
        val loan = requireLoan(id); val admin = requireUser(email); ensureNotFinal(loan)
        if (loan.status != LoanStatus.APPROVED)
            throw IllegalLoanTransitionException("Only APPROVED loans can be disbursed")
        val from = loan.status
        loan.status = LoanStatus.DISBURSED
        loan.disbursedBy = admin
        loan.disbursedAt = Instant.now()
        loan.disbursementRef = req.disbursementRef
        loans.save(loan)
        recordHistory(loan, from, LoanStatus.DISBURSED, admin, "Disbursement ref: ${req.disbursementRef}")

        loan.applicant?.let {
            notifications.notify(it, NotificationType.LOAN_DISBURSED,
                "Funds disbursed",
                "Loan ${loan.reference} was disbursed. Reference: ${req.disbursementRef}",
                "loan", loan.id)
        }
        audit.log(email, "LOAN_DISBURSED", "loan", loan.id,
            mapOf("amount" to loan.amount, "ref" to req.disbursementRef))
        log.info("Loan {} disbursed by {}", loan.reference, email)
        return toResponse(loan)
    }

    @Transactional
    fun repayLoan(id: UUID, email: String, req: RepayRequest): LoanResponse {
        val loan = requireLoan(id); val admin = requireUser(email); ensureNotFinal(loan)
        if (loan.status != LoanStatus.DISBURSED)
            throw IllegalLoanTransitionException("Only DISBURSED loans can be marked repaid")
        val from = loan.status
        loan.status = LoanStatus.REPAID
        loan.repaidAt = Instant.now()
        loans.save(loan)
        recordHistory(loan, from, LoanStatus.REPAID, admin, "Repayment ref: ${req.repaymentRef}")

        loan.applicant?.let {
            notifications.notify(it, NotificationType.LOAN_REPAID,
                "Loan fully repaid",
                "Loan ${loan.reference} is now marked as repaid. Thank you.",
                "loan", loan.id)
        }
        audit.log(email, "LOAN_REPAID", "loan", loan.id, mapOf("ref" to req.repaymentRef))
        return toResponse(loan)
    }

    @Transactional
    fun cancelLoan(id: UUID, email: String): LoanResponse {
        val loan = requireLoan(id); val owner = requireUser(email)
        if (loan.applicant?.id != owner.id)
            throw org.springframework.security.access.AccessDeniedException("Not your loan")
        if (loan.status !in listOf(LoanStatus.PENDING, LoanStatus.UNDER_REVIEW))
            throw IllegalLoanTransitionException("Only PENDING or UNDER_REVIEW loans can be cancelled")
        val from = loan.status
        loan.status = LoanStatus.CANCELLED
        loans.save(loan)
        recordHistory(loan, from, LoanStatus.CANCELLED, owner, "Cancelled by applicant")
        audit.log(email, "LOAN_CANCELLED", "loan", loan.id)
        return toResponse(loan)
    }

    // -------- helpers --------

    private fun requireLoan(id: UUID): Loan =
        loans.findById(id).orElseThrow { LoanNotFoundException("Loan $id not found") }

    private fun requireUser(email: String): User =
        users.findByEmail(email) ?: throw IllegalStateException("Authenticated user missing")

    private fun ensureNotFinal(loan: Loan) {
        // Only true terminal states. DISBURSED is NOT terminal — it can still
        // transition to REPAID or DEFAULTED.
        if (loan.status in listOf(LoanStatus.REPAID,
                LoanStatus.REJECTED, LoanStatus.CANCELLED, LoanStatus.DEFAULTED))
            throw IllegalLoanTransitionException("Loan ${loan.reference} is in final state ${loan.status}")
    }

    private fun uniqueReference(): String {
        var candidate = refGen.next()
        var attempts = 0
        while (loans.findByReference(candidate) != null) {
            if (++attempts > 5) throw IllegalStateException("Could not generate unique reference")
            candidate = refGen.next()
        }
        return candidate
    }

    private fun recordHistory(loan: Loan, from: LoanStatus?, to: LoanStatus, by: User, notes: String?) {
        history.save(LoanStatusHistory(loan = loan, fromStatus = from, toStatus = to, changedBy = by, notes = notes))
    }

    private fun toResponse(l: Loan): LoanResponse = LoanResponse(
        id = l.id!!, reference = l.reference,
        applicantId = l.applicant!!.id!!, applicantName = l.applicant!!.fullName,
        amount = l.amount, currency = l.currency,
        termMonths = l.termMonths, interestRate = l.interestRate, purpose = l.purpose,
        status = l.status, submittedAt = l.submittedAt,
        reviewedBy = l.reviewedBy?.fullName, reviewedAt = l.reviewedAt,
        approvedBy = l.approvedBy?.fullName, approvedAt = l.approvedAt,
        rejectedBy = l.rejectedBy?.fullName, rejectedAt = l.rejectedAt,
        rejectionReason = l.rejectionReason,
        disbursedBy = l.disbursedBy?.fullName, disbursedAt = l.disbursedAt,
        disbursementRef = l.disbursementRef, repaidAt = l.repaidAt
    )
}
