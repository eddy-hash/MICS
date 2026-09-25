'use client';
import { ExportBundle } from '@/components/ui/ExportBundle';
import type { PdfOptions } from '@/lib/pdf';
import type { AnalyticsSummary } from '@/lib/types';

export function AnalyticsExportButton({ summary }: { summary: AnalyticsSummary }) {
  function build(): PdfOptions {
    return {
      header: {
        title: 'Analytics Report',
        subtitle: `Portfolio overview · ${summary.currency}`,
        reference: new Date().toISOString().slice(0, 10),
      },
      sections: [
        {
          heading: 'Key Metrics',
          rows: [
            ['Total loans', String(summary.totalLoans)],
            ['Pending', String(summary.pendingCount)],
            ['Approved', String(summary.approvedCount)],
            ['Disbursed', String(summary.disbursedCount)],
            ['Rejected', String(summary.rejectedCount)],
            ['Total disbursed', `${summary.totalDisbursedAmount.toLocaleString()} ${summary.currency}`],
            ['Total pending', `${summary.totalPendingAmount.toLocaleString()} ${summary.currency}`],
          ],
        },
      ],
      footerNote: 'Confidential — management report generated from NaedCredit.',
    };
  }

  return (
    <ExportBundle
      filename="naedcredit-analytics"
      printTitle={`NaedCredit-Analytics-${new Date().toISOString().slice(0, 10)}`}
      pdf={build}
    />
  );
}
