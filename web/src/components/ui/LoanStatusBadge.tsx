import { Badge } from './Badge';
import type { LoanStatus } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';

const toneFor: Record<LoanStatus, 'amber' | 'blue' | 'emerald' | 'violet' | 'rose' | 'slate'> = {
  PENDING: 'amber',
  UNDER_REVIEW: 'blue',
  APPROVED: 'emerald',
  REJECTED: 'rose',
  DISBURSED: 'violet',
  REPAID: 'slate',
  DEFAULTED: 'rose',
  CANCELLED: 'slate',
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return (
    <Badge tone={toneFor[status]} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
