'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { notify } from '@/lib/toast';
import type { Loan, Role } from '@/lib/types';
import { PERMISSIONS } from '@/lib/permissions';
import { formatMoney } from '@/lib/format';

interface LoanActionsPanelProps {
  loan: Loan;
  roles: Role[];
  permissions: Set<string>;
}

type Success = {
  title: string;
  message: string;
  details?: React.ReactNode;
} | null;

export function LoanActionsPanel({ loan, roles: _roles, permissions }: LoanActionsPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [disburseOpen, setDisburseOpen] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [disburseRef, setDisburseRef] = useState('');
  const [repayRef, setRepayRef] = useState('');
  const [success, setSuccess] = useState<Success>(null);

  const canApprove = permissions.has(PERMISSIONS.LOAN_APPROVE) && ['PENDING', 'UNDER_REVIEW'].includes(loan.status);
  const canReject = permissions.has(PERMISSIONS.LOAN_REJECT) && ['PENDING', 'UNDER_REVIEW'].includes(loan.status);
  const canDisburse = permissions.has(PERMISSIONS.LOAN_DISBURSE) && loan.status === 'APPROVED';
  const canRepay = permissions.has(PERMISSIONS.LOAN_REPAY) && loan.status === 'DISBURSED';
  const canCancel = permissions.has(PERMISSIONS.LOAN_CANCEL_OWN) && ['PENDING', 'UNDER_REVIEW'].includes(loan.status);

  async function call(path: string, body: unknown, onOk: () => void, key: string, errorTitle: string) {
    setBusy(key);
    try {
      const r = await fetch(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        notify.error(errorTitle, { subMessage: d?.message });
        return;
      }
      onOk();
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const anyAction = canApprove || canReject || canDisburse || canRepay || canCancel;
  if (!anyAction) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold text-slate-700">Actions</h3>
        <p className="mt-1 text-xs text-slate-500">
          No actions available for this loan in its current state.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Actions</h3>

        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <Button
              onClick={() =>
                call(
                  `/api/loans/${loan.id}/approve`,
                  { notes: 'Approved' },
                  () => {
                    notify.success('Loan approved');
                    setSuccess({
                      title: 'Loan approved',
                      message: `Application ${loan.reference} has been approved.`,
                      details: (
                        <div className="space-y-1 text-slate-700">
                          <p><span className="text-slate-500">Applicant:</span> {loan.applicantName}</p>
                          <p><span className="text-slate-500">Amount:</span> {formatMoney(loan.amount, loan.currency)}</p>
                          <p><span className="text-slate-500">Status:</span> Approved — awaiting disbursement</p>
                        </div>
                      ),
                    });
                  },
                  'approve',
                  'Could not approve loan',
                )
              }
              loading={busy === 'approve'}
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Approve
            </Button>
          )}

          {canReject && (
            <Button
              variant="danger"
              onClick={() => setRejectOpen(true)}
              leftIcon={<XCircleIcon className="h-4 w-4" />}
            >
              Reject
            </Button>
          )}

          {canDisburse && (
            <Button
              onClick={() => setDisburseOpen(true)}
              className="bg-violet-600 hover:bg-violet-700"
              leftIcon={<CurrencyDollarIcon className="h-4 w-4" />}
            >
              Disburse
            </Button>
          )}

          {canRepay && (
            <Button
              variant="secondary"
              onClick={() => setRepayOpen(true)}
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
            >
              Mark repaid
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              onClick={() =>
                call(
                  `/api/loans/${loan.id}/cancel`,
                  {},
                  () => {
                    notify.info('Application cancelled');
                    setSuccess({
                      title: 'Application cancelled',
                      message: `Loan ${loan.reference} has been cancelled.`,
                    });
                  },
                  'cancel',
                  'Could not cancel application',
                )
              }
              loading={busy === 'cancel'}
              leftIcon={<ArrowUturnLeftIcon className="h-4 w-4" />}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject loan"
        description="The applicant will be notified with your reason."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={busy === 'reject'}
              disabled={rejectReason.trim().length < 3}
              onClick={() =>
                call(
                  `/api/loans/${loan.id}/reject`,
                  { reason: rejectReason },
                  () => {
                    setRejectOpen(false);
                    notify.warning('Loan rejected', { subMessage: 'Applicant notified' });
                    setSuccess({
                      title: 'Loan rejected',
                      message: `Application ${loan.reference} has been rejected.`,
                      details: (
                        <div className="space-y-1 text-slate-700">
                          <p><span className="text-slate-500">Applicant:</span> {loan.applicantName}</p>
                          <p><span className="text-slate-500">Reason:</span> {rejectReason}</p>
                        </div>
                      ),
                    });
                  },
                  'reject',
                  'Could not reject loan',
                )
              }
            >
              Reject loan
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason"
          rows={4}
          minLength={3}
          maxLength={1000}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          hint="Minimum 3 characters. This is sent to the applicant."
        />
      </Modal>

      <Modal
        open={disburseOpen}
        onClose={() => setDisburseOpen(false)}
        title="Disburse funds"
        description="Enter the external transaction reference for reconciliation."
        footer={
          <>
            <Button variant="outline" onClick={() => setDisburseOpen(false)}>Cancel</Button>
            <Button
              loading={busy === 'disburse'}
              disabled={disburseRef.trim().length < 3}
              onClick={() =>
                call(
                  `/api/loans/${loan.id}/disburse`,
                  { disbursementRef: disburseRef },
                  () => {
                    setDisburseOpen(false);
                    notify.success('Funds disbursed');
                    setSuccess({
                      title: 'Funds disbursed',
                      message: `Loan ${loan.reference} has been disbursed.`,
                      details: (
                        <div className="space-y-1 text-slate-700">
                          <p><span className="text-slate-500">Amount:</span> {formatMoney(loan.amount, loan.currency)}</p>
                          <p><span className="text-slate-500">Reference:</span> <span className="font-mono">{disburseRef}</span></p>
                          <p><span className="text-slate-500">Recipient:</span> {loan.applicantName}</p>
                        </div>
                      ),
                    });
                  },
                  'disburse',
                  'Could not disburse',
                )
              }
            >
              Disburse
            </Button>
          </>
        }
      >
        <Input
          label="Disbursement reference"
          value={disburseRef}
          onChange={(e) => setDisburseRef(e.target.value)}
          placeholder="MPESA-XXXXXXXX"
          hint="Min 3 characters."
        />
      </Modal>

      <Modal
        open={repayOpen}
        onClose={() => setRepayOpen(false)}
        title="Mark loan repaid"
        description="Confirm the repayment reference for reconciliation."
        footer={
          <>
            <Button variant="outline" onClick={() => setRepayOpen(false)}>Cancel</Button>
            <Button
              loading={busy === 'repay'}
              disabled={repayRef.trim().length < 3}
              onClick={() =>
                call(
                  `/api/loans/${loan.id}/repay`,
                  { repaymentRef: repayRef },
                  () => {
                    setRepayOpen(false);
                    notify.success('Loan marked repaid');
                    setSuccess({
                      title: 'Loan fully repaid',
                      message: `Application ${loan.reference} is now marked as repaid.`,
                      details: (
                        <div className="space-y-1 text-slate-700">
                          <p><span className="text-slate-500">Amount:</span> {formatMoney(loan.amount, loan.currency)}</p>
                          <p><span className="text-slate-500">Reference:</span> <span className="font-mono">{repayRef}</span></p>
                        </div>
                      ),
                    });
                  },
                  'repay',
                  'Could not mark repaid',
                )
              }
            >
              Mark repaid
            </Button>
          </>
        }
      >
        <Input
          label="Repayment reference"
          value={repayRef}
          onChange={(e) => setRepayRef(e.target.value)}
          placeholder="MPESA-REPAY-XXXXXXXX"
          hint="Min 3 characters."
        />
      </Modal>

      <SuccessModal
        open={success !== null}
        onClose={() => setSuccess(null)}
        title={success?.title ?? ''}
        message={success?.message ?? ''}
        details={success?.details}
        buttonText="Done"
      />
    </>
  );
}
