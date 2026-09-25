package LOANS.services.config

import LOANS.services.user.Role
import LOANS.services.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order

/**
 * One-time fix-up for environments where the seed previously granted all three
 * roles to staff. Runs after Flyway and after SeedData.
 *
 * Safe to run repeatedly — idempotent.
 */
@Configuration
class DataFixer {

    private val log = LoggerFactory.getLogger(javaClass)

    @Bean
    @Order(1) // after SeedData
    fun fixStaffRoles(users: UserRepository) = CommandLineRunner {
        users.findByEmail("admin@yourcompany.com")?.let { admin ->
            val fixed = mutableSetOf(Role.ADMINISTRATOR)
            if (admin.roles != fixed) {
                admin.roles = fixed
                users.save(admin)
                log.info("Fixed admin roles → {}", fixed)
            }
        }
        users.findByEmail("officer@yourcompany.com")?.let { officer ->
            val fixed = mutableSetOf(Role.OFFICER)
            if (officer.roles != fixed) {
                officer.roles = fixed
                users.save(officer)
                log.info("Fixed officer roles → {}", fixed)
            }
        }
    }
}
