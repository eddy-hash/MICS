CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(32),
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    locked          BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users (LOWER(email));

CREATE TABLE user_roles (
    user_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role     VARCHAR(32) NOT NULL,
    PRIMARY KEY (user_id, role),
    CONSTRAINT chk_user_roles_role
        CHECK (role IN ('LOANEE', 'OFFICER', 'ADMINISTRATOR'))
);
CREATE INDEX idx_user_roles_role ON user_roles (role);

CREATE TABLE refresh_tokens (
    jti           UUID         PRIMARY KEY,
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at    TIMESTAMPTZ  NOT NULL,
    revoked       BOOLEAN      NOT NULL DEFAULT FALSE,
    revoked_at    TIMESTAMPTZ,
    replaced_by   UUID,
    issued_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ip_address    INET,
    user_agent    VARCHAR(512)
);
CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens (user_id, revoked)
    WHERE revoked = FALSE;

CREATE TABLE loans (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    reference         VARCHAR(32)   NOT NULL UNIQUE,
    applicant_id      UUID          NOT NULL REFERENCES users(id),
    amount            NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency          CHAR(3)       NOT NULL DEFAULT 'USD',
    term_months       INT           NOT NULL CHECK (term_months BETWEEN 1 AND 360),
    interest_rate     NUMERIC(5,4)  NOT NULL CHECK (interest_rate >= 0),
    purpose           TEXT,
    status            VARCHAR(32)   NOT NULL DEFAULT 'PENDING',
    CONSTRAINT chk_loans_status CHECK (status IN (
        'PENDING','UNDER_REVIEW','APPROVED','REJECTED',
        'DISBURSED','REPAID','DEFAULTED','CANCELLED'
    )),
    submitted_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    reviewed_by       UUID          REFERENCES users(id),
    reviewed_at       TIMESTAMPTZ,
    review_notes      TEXT,
    approved_by       UUID          REFERENCES users(id),
    approved_at       TIMESTAMPTZ,
    rejected_by       UUID          REFERENCES users(id),
    rejected_at       TIMESTAMPTZ,
    rejection_reason  TEXT,
    disbursed_by      UUID          REFERENCES users(id),
    disbursed_at      TIMESTAMPTZ,
    disbursement_ref  VARCHAR(64),
    repaid_at         TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loans_applicant    ON loans (applicant_id);
CREATE INDEX idx_loans_status       ON loans (status);
CREATE INDEX idx_loans_submitted_at ON loans (submitted_at DESC);
CREATE INDEX idx_loans_pending      ON loans (status, submitted_at DESC)
    WHERE status IN ('PENDING','UNDER_REVIEW');

CREATE TABLE loan_status_history (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id      UUID         NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    from_status  VARCHAR(32),
    to_status    VARCHAR(32)  NOT NULL,
    changed_by   UUID         REFERENCES users(id),
    changed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    notes        TEXT
);
CREATE INDEX idx_loan_history_loan ON loan_status_history (loan_id, changed_at DESC);

CREATE TABLE audit_log (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id      UUID         REFERENCES users(id),
    action        VARCHAR(64)  NOT NULL,
    resource_type VARCHAR(64),
    resource_id   UUID,
    ip_address    INET,
    user_agent    VARCHAR(512),
    metadata      JSONB,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_actor    ON audit_log (actor_id, created_at DESC);
CREATE INDEX idx_audit_action   ON audit_log (action, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log (resource_type, resource_id);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_loans_updated_at
    BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
