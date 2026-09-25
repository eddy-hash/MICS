package LOANS.services.auth.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class RegisterRequest(
    @field:Email @field:NotBlank
    val email: String,

    @field:NotBlank
    @field:Size(min = 12, max = 128)
    @field:Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Password must contain lowercase, uppercase, and a digit"
    )
    val password: String,

    @field:NotBlank @field:Size(min = 1, max = 100)
    val firstName: String,

    @field:NotBlank @field:Size(min = 1, max = 100)
    val lastName: String,

    @field:Size(max = 32)
    val phone: String? = null
)
