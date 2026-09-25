/**
 * Permission string catalog. Source of truth is the backend — these constants
 * exist only so we don't mistype strings in the UI. Never used for gating.
 */

export const PERMISSIONS = {
  LOAN_CREATE: 'loan:create',
  LOAN_VIEW_OWN: 'loan:view:own',
  LOAN_VIEW_ALL: 'loan:view:all',
  LOAN_REVIEW: 'loan:review',
  LOAN_APPROVE: 'loan:approve',
  LOAN_REJECT: 'loan:reject',
  LOAN_DISBURSE: 'loan:disburse',
  LOAN_REPAY: 'loan:repay',
  LOAN_CANCEL_OWN: 'loan:cancel:own',
  USER_VIEW_ALL: 'user:view:all',
  USER_MANAGE_ROLES: 'user:manage:roles',
  USER_MANAGE_STATUS: 'user:manage:status',
  AUDIT_VIEW: 'audit:view',
  ANALYTICS_VIEW: 'analytics:view',
  NOTIFICATION_VIEW_OWN: 'notification:view:own',
  PROFILE_EDIT_OWN: 'profile:edit:own',
  ROLE_PERMISSION_MANAGE: 'role:permission:manage',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];
