package LOANS.services.notification

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/notifications")
class NotificationController(
    private val service: NotificationService,
    private val deleteService: NotificationDeleteService,
) {

    @GetMapping
    fun list(
        authentication: Authentication,
        @RequestParam(defaultValue = "false") unreadOnly: Boolean,
        @PageableDefault(size = 20) pageable: Pageable
    ): Page<Notification> = service.list(authentication.name, unreadOnly, pageable)

    @GetMapping("/unread-count")
    fun unreadCount(authentication: Authentication): Map<String, Long> =
        mapOf("count" to service.unreadCount(authentication.name))

    @PostMapping("/{id}/read")
    fun markRead(authentication: Authentication, @PathVariable id: UUID): ResponseEntity<Any> {
        val n = service.markRead(authentication.name, id)
        return if (n > 0) ResponseEntity.ok(mapOf("ok" to true))
        else ResponseEntity.notFound().build()
    }

    @PostMapping("/read-all")
    fun markAllRead(authentication: Authentication): Map<String, Boolean> {
        service.markAllRead(authentication.name)
        return mapOf("ok" to true)
    }

    @DeleteMapping("/{id}")
    fun delete(authentication: Authentication, @PathVariable id: UUID): ResponseEntity<Any> {
        val ok = deleteService.delete(authentication.name, id)
        return if (ok) ResponseEntity.noContent().build()
        else ResponseEntity.notFound().build()
    }
}
