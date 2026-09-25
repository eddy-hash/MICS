package LOANS.services.auth

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

interface EmailService {
    fun sendPasswordReset(to: String, name: String, resetUrl: String)
}

/**
 * Dev-only implementation. Logs the reset link to stdout.
 * Replace with an SMTP/SendGrid/SES implementation for production.
 */
@Service
class LoggingEmailService : EmailService {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun sendPasswordReset(to: String, name: String, resetUrl: String) {
        log.warn("""
            ┌──────────────────────────────────────────────────────────────
            │ [DEV EMAIL] Password reset for $name <$to>
            │ Click: $resetUrl
            │ (In production this is sent via SMTP/SendGrid/SES.)
            └──────────────────────────────────────────────────────────────
        """.trimIndent())
    }
}
