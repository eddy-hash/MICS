-- RBAC: role → permission mappings.
-- Roles stay in code (enum). Permissions stay in code (enum).
-- Only the mapping is dynamic so admins can adjust policies without deploys.

CREATE TABLE role_permissions (
    role        VARCHAR(32) NOT NULL,
    permission  VARCHAR(64) NOT NULL,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role, permission),
    CONSTRAINT chk_rp_role
        CHECK (role IN ('LOANEE', 'OFFICER', 'ADMINISTRATOR')),
    CONSTRAINT chk_rp_permission
        CHECK (permission ~ '^[a-z]+:[a-z:_]+$')
);

CREATE INDEX idx_rp_role ON role_permissions (role);

-- ============ DEFAULT MAPPINGS ============
-- LOANEE: can apply, view own, cancel own, edit own profile
INSERT INTO role_permissions (role, permission) VALUES
    ('LOANEE', 'loan:create'),
    ('LOANEE', 'loan:view:own'),
    ('LOANEE', 'loan:cancel:own'),
    ('LOANEE', 'notification:view:own'),
    ('LOANEE', 'profile:edit:own');

-- OFFICER: sees queue, reviews/approves/rejects, has own profile
INSERT INTO role_permissions (role, permission) VALUES
    ('OFFICER', 'loan:view:all'),
    ('OFFICER', 'loan:review'),
    ('OFFICER', 'loan:approve'),
    ('OFFICER', 'loan:reject'),
    ('OFFICER', 'notification:view:own'),
    ('OFFICER', 'profile:edit:own');

-- ADMINISTRATOR: everything
INSERT INTO role_permissions (role, permission) VALUES
    ('ADMINISTRATOR', 'loan:create'),
    ('ADMINISTRATOR', 'loan:view:own'),
    ('ADMINISTRATOR', 'loan:view:all'),
    ('ADMINISTRATOR', 'loan:review'),
    ('ADMINISTRATOR', 'loan:approve'),
    ('ADMINISTRATOR', 'loan:reject'),
    ('ADMINISTRATOR', 'loan:disburse'),
    ('ADMINISTRATOR', 'loan:repay'),
    ('ADMINISTRATOR', 'loan:cancel:own'),
    ('ADMINISTRATOR', 'user:view:all'),
    ('ADMINISTRATOR', 'user:manage:roles'),
    ('ADMINISTRATOR', 'user:manage:status'),
    ('ADMINISTRATOR', 'audit:view'),
    ('ADMINISTRATOR', 'analytics:view'),
    ('ADMINISTRATOR', 'notification:view:own'),
    ('ADMINISTRATOR', 'profile:edit:own'),
    ('ADMINISTRATOR', 'role:permission:manage');
