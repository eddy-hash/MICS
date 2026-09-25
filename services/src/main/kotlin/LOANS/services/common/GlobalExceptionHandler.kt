package LOANS.services.common

import LOANS.services.admin.UserNotFoundException
import LOANS.services.loan.dto.IllegalLoanTransitionException
import LOANS.services.loan.dto.LoanNotFoundException
import LOANS.services.security.InvalidTokenException
import LOANS.services.security.TooManyLoginAttemptsException
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    data class ApiError(
        val timestamp: String,
        val status: Int,
        val error: String,
        val message: String,
        val path: String?,
        val fieldErrors: Map<String, String>? = null
    )

    @ExceptionHandler(LoanNotFoundException::class)
    fun notFound(e: LoanNotFoundException, req: HttpServletRequest) =
        build(HttpStatus.NOT_FOUND, e.message ?: "Not found", req)

    @ExceptionHandler(UserNotFoundException::class)
    fun userNotFound(e: UserNotFoundException, req: HttpServletRequest) =
        build(HttpStatus.NOT_FOUND, e.message ?: "User not found", req)

    @ExceptionHandler(IllegalLoanTransitionException::class)
    fun badTransition(e: IllegalLoanTransitionException, req: HttpServletRequest) =
        build(HttpStatus.CONFLICT, e.message ?: "Illegal state transition", req)

    @ExceptionHandler(InvalidTokenException::class)
    fun badToken(e: InvalidTokenException, req: HttpServletRequest) =
        build(HttpStatus.BAD_REQUEST, e.message ?: "Invalid token", req)

    @ExceptionHandler(TooManyLoginAttemptsException::class)
    fun tooMany(e: TooManyLoginAttemptsException, req: HttpServletRequest) =
        build(HttpStatus.TOO_MANY_REQUESTS, e.message ?: "Too many requests", req)

    @ExceptionHandler(BadCredentialsException::class)
    fun badCreds(e: BadCredentialsException, req: HttpServletRequest) =
        build(HttpStatus.UNAUTHORIZED, "Invalid credentials", req)

    @ExceptionHandler(AccessDeniedException::class)
    fun forbidden(e: AccessDeniedException, req: HttpServletRequest) =
        build(HttpStatus.FORBIDDEN, e.message ?: "Access denied", req)

    @ExceptionHandler(IllegalArgumentException::class)
    fun badArg(e: IllegalArgumentException, req: HttpServletRequest) =
        build(HttpStatus.BAD_REQUEST, e.message ?: "Bad request", req)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun validation(e: MethodArgumentNotValidException, req: HttpServletRequest): ResponseEntity<ApiError> {
        val fields = e.bindingResult.fieldErrors.associate {
            it.field to (it.defaultMessage ?: "invalid")
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiError(
                timestamp = Instant.now().toString(),
                status = 400,
                error = "Validation failed",
                message = "One or more fields are invalid",
                path = req.requestURI,
                fieldErrors = fields
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun fallback(e: Exception, req: HttpServletRequest): ResponseEntity<ApiError> {
        log.error("Unhandled exception on {} {}", req.method, req.requestURI, e)
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error", req)
    }

    private fun build(status: HttpStatus, message: String, req: HttpServletRequest): ResponseEntity<ApiError> =
        ResponseEntity.status(status).body(
            ApiError(
                timestamp = Instant.now().toString(),
                status = status.value(),
                error = status.reasonPhrase,
                message = message,
                path = req.requestURI
            )
        )
}
