package LOANS.services.loan.dto

import LOANS.services.loan.LoanStatus
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * TZS-aware defaults. Minimum 100,000 TZS ≈ USD 40.
 * Maximum 500,000,000 TZS ≈ USD 190,000 — typical microfinance ceiling.
 */
data class CreateLoanRequest(
    @field:NotNull
    @field:DecimalMin(value = "100000", message = "Minimum loan is 100,000 TZS")
    @field:DecimalMax(value = "500000000", message = "Maximum loan is 500,000,000 TZS")
    val amount: BigDecimal,

    @field:NotBlank @field:Size(min = 3, max = 3)
    val currency: String = "TZS",

    @field:NotNull @field:Min(1) @field:Max(360)
    val termMonths: Int,

    // 0.05 = 5%, 0.30 = 30%. Range 0–100% is fine for any market.
    @field:NotNull @field:DecimalMin("0.0") @field:DecimalMax("1.0")
    val interestRate: BigDecimal,

    @field:Size(max = 2000)
    val purpose: String? = null
)

data class RejectLoanRequest(
    @field:NotBlank @field:Size(min = 3, max = 1000)
    val reason: String
)

data class ReviewLoanRequest(
    @field:Size(max = 2000)
    val notes: String? = null
)

data class DisburseLoanRequest(
    @field:NotBlank @field:Size(min = 3, max = 64)
    val disbursementRef: String
)

data class RepayRequest(
    @field:NotBlank @field:Size(min = 3, max = 64)
    val repaymentRef: String
)

data class LoanResponse(
    val id: UUID,
    val reference: String,
    val applicantId: UUID,
    val applicantName: String,
    val amount: BigDecimal,
    val currency: String,
    val termMonths: Int,
    val interestRate: BigDecimal,
    val purpose: String?,
    val status: LoanStatus,
    val submittedAt: Instant,
    val reviewedBy: String?,
    val reviewedAt: Instant?,
    val approvedBy: String?,
    val approvedAt: Instant?,
    val rejectedBy: String?,
    val rejectedAt: Instant?,
    val rejectionReason: String?,
    val disbursedBy: String?,
    val disbursedAt: Instant?,
    val disbursementRef: String?,
    val repaidAt: Instant?
)

data class LoanHistoryEntry(
    val fromStatus: LoanStatus?,
    val toStatus: LoanStatus,
    val changedBy: String?,
    val changedAt: Instant,
    val notes: String?
)

data class LoanDetailResponse(
    val loan: LoanResponse,
    val history: List<LoanHistoryEntry>
)

data class LoanAnalyticsSummary(
    val totalLoans: Long,
    val pendingCount: Long,
    val approvedCount: Long,
    val disbursedCount: Long,
    val rejectedCount: Long,
    val totalDisbursedAmount: BigDecimal,
    val totalPendingAmount: BigDecimal,
    // NEW: what currency these totals are in. Frontend displays this.
    val currency: String
)

class IllegalLoanTransitionException(message: String) : RuntimeException(message)
class LoanNotFoundException(message: String) : RuntimeException(message)
