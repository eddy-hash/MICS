package LOANS.services.loan

import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.time.Year

@Component
class LoanReferenceGenerator {
    private val random = SecureRandom()
    private val alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

    fun next(): String {
        val year = Year.now().value
        val suffix = (1..6).map { alphabet[random.nextInt(alphabet.length)] }.joinToString("")
        return "LN-$year-$suffix"
    }
}
