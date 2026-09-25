package LOANS.services.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

interface PasswordResetTokenRepository : JpaRepository<PasswordResetToken, UUID> {
    fun findByToken(token: UUID): PasswordResetToken?

    @Modifying
    @Transactional
    @Query("UPDATE PasswordResetToken t SET t.used = true, t.usedAt = CURRENT_TIMESTAMP WHERE t.user.id = :userId AND t.used = false")
    fun invalidateAllForUser(@Param("userId") userId: UUID)
}
