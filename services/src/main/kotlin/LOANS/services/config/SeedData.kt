package LOANS.services.config

import LOANS.services.user.Role
import LOANS.services.user.User
import LOANS.services.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.password.PasswordEncoder

@Configuration
class SeedData {

    private val log = LoggerFactory.getLogger(javaClass)

    @Bean
    fun seedUsers(users: UserRepository, encoder: PasswordEncoder) = CommandLineRunner {
        if (!users.existsByEmail("admin@yourcompany.com")) {
            users.save(User(
                email = "admin@yourcompany.com",
                passwordHash = encoder.encode("ChangeMe123!")!!,
                firstName = "System",
                lastName = "Administrator",
                // ADMINISTRATOR only — no LOANEE, no OFFICER
                roles = mutableSetOf(Role.ADMINISTRATOR)
            ))
            log.info("Seeded admin: admin@yourcompany.com")
        }
        if (!users.existsByEmail("officer@yourcompany.com")) {
            users.save(User(
                email = "officer@yourcompany.com",
                passwordHash = encoder.encode("Officer123!")!!,
                firstName = "Loan",
                lastName = "Officer",
                // OFFICER only — reviews loans, does not apply
                roles = mutableSetOf(Role.OFFICER)
            ))
            log.info("Seeded officer: officer@yourcompany.com")
        }
        if (!users.existsByEmail("loanee@yourcompany.com")) {
            users.save(User(
                email = "loanee@yourcompany.com",
                passwordHash = encoder.encode("Loanee123!")!!,
                firstName = "Test",
                lastName = "Borrower",
                // LOANEE only — applies for loans
                roles = mutableSetOf(Role.LOANEE)
            ))
            log.info("Seeded loanee: loanee@yourcompany.com")
        }
    }
}
