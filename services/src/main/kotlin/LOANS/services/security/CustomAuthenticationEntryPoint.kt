package LOANS.services.security

import tools.jackson.databind.ObjectMapper
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.stereotype.Component
import java.time.Instant

@Component
class CustomAuthenticationEntryPoint(
    private val objectMapper: ObjectMapper
) : AuthenticationEntryPoint, AccessDeniedHandler {

    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException
    ) {
        writeJson(response, request, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized",
            "Full authentication is required to access this resource.")
    }

    override fun handle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        accessDeniedException: AccessDeniedException
    ) {
        writeJson(response, request, HttpServletResponse.SC_FORBIDDEN, "Forbidden",
            "You do not have permission to access this resource.")
    }

    private fun writeJson(
        response: HttpServletResponse,
        request: HttpServletRequest,
        status: Int,
        error: String,
        message: String
    ) {
        response.status = status
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.characterEncoding = "UTF-8"
        val body = mapOf(
            "timestamp" to Instant.now().toString(),
            "status" to status,
            "error" to error,
            "message" to message,
            "path" to request.requestURI
        )
        response.writer.write(objectMapper.writeValueAsString(body))
    }
}
