'use client';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { money, dateLong, type PdfOptions } from '@/lib/pdf';
import type { LoanDetail } from '@/lib/types';

export function ExportLoanButton({ detail }: { detail: LoanDetail }) {
  function build(): PdfOptions {
    const { loan: l, history } = detail;

    return {
      header: {
        title: 'Loan Statement',
        subtitle: 'Official summary of loan application and status',
        reference: l.reference,
      },
      sections: [
        {
          heading: 'Applicant',
          rows: [
            ['Full name', l.applicantName],
            ['Applicant ID', l.applicantId.slice(0, 8) + '…'],
          ],
        },
        {
          heading: 'Loan Details',
          rows: [
            ['Reference', l.reference],
            ['Status', l.status.replace(/_/g, ' ')],
            ['Amount', money(l.amount, l.currency)],
            ['Currency', l.currency],
            ['Term', `${l.termMonths} months`],
            ['Interest rate', `${(l.interestRate * 100).toFixed(2)}% p.a.`],
            ...(l.purpose ? [['Purpose', l.purpose] as [string, string]] : []),
          ],
        },
        {
          heading: 'Timeline',
          rows: [
            ['Submitted', dateLong(l.submittedAt)],
            ...(l.reviewedAt ? [['Reviewed', dateLong(l.reviewedAt)] as [string, string]] : []),
            ...(l.approvedAt ? [['Approved', dateLong(l.approvedAt)] as [string, string]] : []),
            ...(l.rejectedAt ? [['Rejected', dateLong(l.rejectedAt)] as [string, string]] : []),
            ...(l.disbursedAt ? [['Disbursed', dateLong(l.disbursedAt)] as [string, string]] : []),
            ...(l.repaidAt ? [['Repaid', dateLong(l.repaidAt)] as [string, string]] : []),
          ],
        },
        ...(l.reviewedBy || l.approvedBy || l.rejectedBy || l.disbursedBy || l.disbursementRef
          ? [
              {
                heading: 'Officers',
                rows: [
                  ...(l.reviewedBy ? [['Reviewed by', l.reviewedBy] as [string, string]] : []),
                  ...(l.approvedBy ? [['Approved by', l.approvedBy] as [string, string]] : []),
                  ...(l.rejectedBy ? [['Rejected by', l.rejectedBy] as [string, string]] : []),
                  ...(l.disbursedBy ? [['Disbursed by', l.disbursedBy] as [string, string]] : []),
                  ...(l.disbursementRef ? [['Disbursement ref', l.disbursementRef] as [string, string]] : []),
                  ...(l.rejectionReason ? [['Rejection reason', l.rejectionReason] as [string, string]] : []),
                ],
              },
            ]
          : []),
      ],
      tables: [
        {
          heading: 'Status History',
          columns: ['Date', 'From', 'To', 'By', 'Notes'],
          rows: history.map((h) => [
            dateLong(h.changedAt),
            h.fromStatus ? h.fromStatus.replace(/_/g, ' ') : '—',
            h.toStatus.replace(/_/g, ' '),
            h.changedBy ?? 'System',
            h.notes ?? '',
          ]),
        },
      ],
      footerNote:
        'This is a system-generated document from NaedCredit. Figures are for reference and may be subject to final reconciliation. For questions, contact support.',
    };
  }

  return (
    <ExportPdfButton
      build={build}
      filename={`naedcredit-${detail.loan.reference}.pdf`}
      label="Export PDF"
    />
  );
}
