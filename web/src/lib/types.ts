export type Role = 'LOANEE' | 'OFFICER' | 'ADMINISTRATOR';

export type LoanStatus =
  | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  | 'DISBURSED' | 'REPAID' | 'DEFAULTED' | 'CANCELLED';

export interface Loan {
  id: string;
  reference: string;
  applicantId: string;
  applicantName: string;
  amount: number;
  currency: string;
  termMonths: number;
  interestRate: number;
  purpose: string | null;
  status: LoanStatus;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  disbursedBy: string | null;
  disbursedAt: string | null;
  disbursementRef: string | null;
  repaidAt: string | null;
}

export interface LoanHistoryEntry {
  fromStatus: LoanStatus | null;
  toStatus: LoanStatus;
  changedBy: string | null;
  changedAt: string;
  notes: string | null;
}

export interface LoanDetail {
  loan: Loan;
  history: LoanHistoryEntry[];
}

export interface Paged<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  metadata: string | null;
  createdAt: string;
  actor: { email: string; firstName: string; lastName: string } | null;
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  enabled: boolean;
  locked: boolean;
  roles: Role[];
  createdAt: string;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roles: Role[];
  enabled: boolean;
  locked: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalLoans: number;
  pendingCount: number;
  approvedCount: number;
  disbursedCount: number;
  rejectedCount: number;
  totalDisbursedAmount: number;
  totalPendingAmount: number;
  currency: string;
}

export interface RbacMatrix {
  allPermissions: string[];
  byRole: Record<Role, string[]>;
}

export const STATUS_LABEL: Record<LoanStatus, string> = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
  REPAID: 'Repaid',
  DEFAULTED: 'Defaulted',
  CANCELLED: 'Cancelled',
};
