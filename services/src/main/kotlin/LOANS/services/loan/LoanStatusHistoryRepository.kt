package LOANS.services.loan

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface LoanStatusHistoryRepository : JpaRepository<LoanStatusHistory, UUID> {
    fun findByLoanIdOrderByChangedAtAsc(loanId: UUID): List<LoanStatusHistory>
}
