package LOANS.services.common

import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Component
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes

@Component
class RequestContext {

    private fun req(): HttpServletRequest? =
        (RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes)?.request

    fun ip(): String? {
        val r = req() ?: return null
        val fwd = r.getHeader("X-Forwarded-For")
        return when {
            !fwd.isNullOrBlank() -> fwd.split(",").first().trim()
            else -> r.remoteAddr
        }
    }

    fun userAgent(): String? = req()?.getHeader("User-Agent")?.take(500)
}
