-- Hibernate maps String fields to VARCHAR. Simplify metadata handling by
-- converting to TEXT; we serialize JSON ourselves in AuditService.
ALTER TABLE audit_log
    ALTER COLUMN metadata TYPE TEXT
    USING metadata::text;
