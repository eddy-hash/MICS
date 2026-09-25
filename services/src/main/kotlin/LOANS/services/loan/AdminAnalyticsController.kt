package LOANS.services.loan

import LOANS.services.loan.dto.LoanAnalyticsSummary
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/analytics")
class AdminAnalyticsController(private val service: LoanService) {

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('analytics:view')")
    fun summary(): LoanAnalyticsSummary = service.analyticsSummary()
}
