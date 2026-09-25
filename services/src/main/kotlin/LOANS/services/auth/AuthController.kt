package LOANS.services.auth

import LOANS.services.auth.dto.*
import LOANS.services.security.InvalidTokenException
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/auth")
class AuthController(private val authService: AuthService) {

    @PostMapping("/register")
    fun register(
        @Valid @RequestBody request: RegisterRequest,
        http: HttpServletRequest
    ): ResponseEntity<Any> = try {
        ResponseEntity.status(HttpStatus.CREATED).body(
            authService.register(request, http.remoteAddr, http.getHeader("User-Agent"))
        )
    } catch (e: IllegalArgumentException) {
        ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(e.message ?: "Conflict", http))
    }

    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        http: HttpServletRequest
    ): ResponseEntity<Any> = try {
        ResponseEntity.ok(
            authService.login(request.email, request.password,
                http.remoteAddr, http.getHeader("User-Agent"))
        )
    } catch (e: BadCredentialsException) {
        ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody("Invalid credentials", http))
    }

    @PostMapping("/refresh")
    fun refresh(
        @Valid @RequestBody request: RefreshRequest,
        http: HttpServletRequest
    ): ResponseEntity<Any> = try {
        ResponseEntity.ok(
            authService.refresh(request.refresh_token, http.remoteAddr, http.getHeader("User-Agent"))
        )
    } catch (e: InvalidTokenException) {
        ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody(e.message ?: "Invalid token", http))
    }

    @PostMapping("/forgot-password")
    fun forgotPassword(
        @Valid @RequestBody request: ForgotPasswordRequest,
        http: HttpServletRequest
    ): ResponseEntity<Any> {
        // Always 200 — do not leak whether email exists
        authService.requestPasswordReset(request.email, http.remoteAddr)
        return ResponseEntity.ok(mapOf("ok" to true))
    }

    @PostMapping("/reset-password")
    fun resetPassword(
        @Valid @RequestBody request: ResetPasswordRequest,
        http: HttpServletRequest
    ): ResponseEntity<Any> = try {
        authService.confirmPasswordReset(request.token, request.newPassword)
        ResponseEntity.ok(mapOf("ok" to true))
    } catch (e: InvalidTokenException) {
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(e.message ?: "Invalid token", http))
    }

    private fun errorBody(message: String, http: HttpServletRequest): Map<String, Any?> = mapOf(
        "timestamp" to Instant.now().toString(),
        "status" to 400,
        "error" to "Request error",
        "message" to message,
        "path" to http.requestURI
    )
}
