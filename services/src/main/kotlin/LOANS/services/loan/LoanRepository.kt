package LOANS.services.loan

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface LoanRepository : JpaRepository<Loan, UUID> {
    fun findByReference(reference: String): Loan?
    fun findByApplicantId(applicantId: UUID, pageable: Pageable): Page<Loan>
    fun findByStatus(status: LoanStatus, pageable: Pageable): Page<Loan>
    fun findByStatusIn(statuses: Collection<LoanStatus>, pageable: Pageable): Page<Loan>
}
