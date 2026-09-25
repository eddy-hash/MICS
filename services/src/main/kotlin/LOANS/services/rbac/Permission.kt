package LOANS.services.rbac

/**
 * Fixed catalogue of permissions. Endpoints reference these by key.
 * Add new ones here; assign to roles via DB (role_permissions table).
 */
enum class Permission(val key: String) {
    // Loans
    LOAN_CREATE("loan:create"),
    LOAN_VIEW_OWN("loan:view:own"),
    LOAN_VIEW_ALL("loan:view:all"),
    LOAN_REVIEW("loan:review"),
    LOAN_APPROVE("loan:approve"),
    LOAN_REJECT("loan:reject"),
    LOAN_DISBURSE("loan:disburse"),
    LOAN_REPAY("loan:repay"),
    LOAN_CANCEL_OWN("loan:cancel:own"),

    // Users
    USER_VIEW_ALL("user:view:all"),
    USER_MANAGE_ROLES("user:manage:roles"),
    USER_MANAGE_STATUS("user:manage:status"),

    // System
    AUDIT_VIEW("audit:view"),
    ANALYTICS_VIEW("analytics:view"),

    // Self-service
    NOTIFICATION_VIEW_OWN("notification:view:own"),
    PROFILE_EDIT_OWN("profile:edit:own"),

    // RBAC admin
    ROLE_PERMISSION_MANAGE("role:permission:manage");

    companion object {
        fun fromKey(key: String): Permission? = entries.firstOrNull { it.key == key }
    }
}
