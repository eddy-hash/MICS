-- V8: Staff roles should NOT have loanee-specific permissions.
--
-- Rationale:
--   ADMINISTRATOR manages the platform — they do not apply for loans.
--   OFFICER reviews loans — they do not apply on behalf of themselves.
--
-- Anyone who needs to be BOTH staff and borrower should be granted
-- both roles explicitly (e.g., OFFICER + LOANEE).
--
-- This migration removes the loanee-only permissions from staff roles.

DELETE FROM role_permissions
WHERE role IN ('OFFICER', 'ADMINISTRATOR')
  AND permission IN ('loan:create', 'loan:view:own', 'loan:cancel:own');
