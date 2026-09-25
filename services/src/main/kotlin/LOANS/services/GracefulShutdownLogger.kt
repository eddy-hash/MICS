package LOANS.services

import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

/**
 * Logs when the application is shutting down and when it has finished.
 * Pairs with server.shutdown=graceful in application.yml.
 */
@Component
class GracefulShutdownLogger {

    private val log = LoggerFactory.getLogger(javaClass)

    @PreDestroy
    fun onShutdown() {
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        log.info("  NaedCredit backend is shutting down...")
        log.info("  Waiting for in-flight requests to complete.")
        log.info("  (Max 20s — timeout-per-shutdown-phase)")
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    }
}
