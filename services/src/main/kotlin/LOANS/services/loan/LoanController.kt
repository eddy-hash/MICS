package LOANS.services.loan

import LOANS.services.loan.dto.*
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/loans")
class LoanController(private val service: LoanService) {

    @PostMapping
    @PreAuthorize("hasAuthority('loan:create')")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(authentication: Authentication, @Valid @RequestBody req: CreateLoanRequest): LoanResponse =
        service.createLoan(authentication.name, req)

    @GetMapping("/mine")
    @PreAuthorize("hasAuthority('loan:view:own')")
    fun mine(authentication: Authentication,
             @PageableDefault(size = 20, sort = ["submittedAt"]) pageable: Pageable): Page<LoanResponse> =
        service.myLoans(authentication.name, pageable)

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('loan:view:all')")
    fun pending(@PageableDefault(size = 20) pageable: Pageable): Page<LoanResponse> =
        service.pendingLoans(pageable)

    @GetMapping("/{id}")
    fun get(authentication: Authentication, @PathVariable id: UUID): LoanDetailResponse {
        // Owner → loan:view:own; Staff → loan:view:all. Accept either.
        val hasAll = authentication.authorities.any { it.authority == "loan:view:all" }
        return service.getLoan(id, authentication.name, hasAll)
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAuthority('loan:review')")
    fun review(authentication: Authentication, @PathVariable id: UUID,
               @Valid @RequestBody req: ReviewLoanRequest): LoanResponse =
        service.reviewLoan(id, authentication.name, req)

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('loan:approve')")
    fun approve(authentication: Authentication, @PathVariable id: UUID,
                @Valid @RequestBody req: ReviewLoanRequest): LoanResponse =
        service.approveLoan(id, authentication.name, req)

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('loan:reject')")
    fun reject(authentication: Authentication, @PathVariable id: UUID,
               @Valid @RequestBody req: RejectLoanRequest): LoanResponse =
        service.rejectLoan(id, authentication.name, req)

    @PutMapping("/{id}/disburse")
    @PreAuthorize("hasRole('ADMINISTRATOR') and hasAuthority('loan:disburse')")
    fun disburse(authentication: Authentication, @PathVariable id: UUID,
                 @Valid @RequestBody req: DisburseLoanRequest): LoanResponse =
        service.disburseLoan(id, authentication.name, req)

    @PutMapping("/{id}/repay")
    @PreAuthorize("hasAuthority('loan:repay')")
    fun repay(authentication: Authentication, @PathVariable id: UUID,
              @Valid @RequestBody req: RepayRequest): LoanResponse =
        service.repayLoan(id, authentication.name, req)

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('loan:cancel:own')")
    fun cancel(authentication: Authentication, @PathVariable id: UUID): LoanResponse =
        service.cancelLoan(id, authentication.name)
}
