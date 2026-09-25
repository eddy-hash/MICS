-- V4: Hibernate maps String → VARCHAR, but earlier migrations declared INET.
-- Postgres refuses implicit INET ← VARCHAR casts on INSERT.
-- Convert every IP-holding column to VARCHAR(64) — handles IPv4, IPv6, proxy headers.

ALTER TABLE refresh_tokens
    ALTER COLUMN ip_address TYPE VARCHAR(64)
    USING ip_address::text;

ALTER TABLE audit_log
    ALTER COLUMN ip_address TYPE VARCHAR(64)
    USING ip_address::text;

ALTER TABLE password_reset_tokens
    ALTER COLUMN requested_by_ip TYPE VARCHAR(64)
    USING requested_by_ip::text;
