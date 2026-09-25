'use client';
import { useState } from 'react';
import {
  PrinterIcon,
  TableCellsIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from './Button';
import { notify } from '@/lib/toast';
import { buildPdf, type PdfOptions } from '@/lib/pdf';
import { buildCsv, downloadCsv, type CsvColumn } from '@/lib/csv';

interface ExportBundleProps<T> {
  /** Base filename without extension, e.g. "naedcredit-loans" */
  filename: string;
  /** Optional CSV columns. If omitted, CSV button is hidden. */
  csv?: {
    rows: T[];
    columns: CsvColumn<T>[];
  };
  /** Optional PDF builder. If omitted, PDF button is hidden. */
  pdf?: () => PdfOptions | Promise<PdfOptions>;
  /** Show the Print button. Default: true */
  showPrint?: boolean;
  /** Document title shown in the browser print dialog */
  printTitle?: string;
}

/**
 * Unified export toolbar: renders CSV, PDF, and Print buttons.
 * Only the buttons whose data is provided are shown.
 */
export function ExportBundle<T>({
  filename,
  csv,
  pdf,
  showPrint = true,
  printTitle,
}: ExportBundleProps<T>) {
  const [busyCsv, setBusyCsv] = useState(false);
  const [busyPdf, setBusyPdf] = useState(false);

  async function handleCsv() {
    if (!csv) return;
    setBusyCsv(true);
    try {
      const content = buildCsv(csv.rows, csv.columns);
      downloadCsv(content, `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
      notify.success('CSV downloaded');
    } catch (e) {
      console.error('[export-csv]', e);
      notify.error('Could not export CSV');
    } finally {
      setBusyCsv(false);
    }
  }

  async function handlePdf() {
    if (!pdf) return;
    setBusyPdf(true);
    try {
      const opts = await pdf();
      const doc = buildPdf(opts);
      doc.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
      notify.success('PDF downloaded');
    } catch (e) {
      console.error('[export-pdf]', e);
      notify.error('Could not export PDF');
    } finally {
      setBusyPdf(false);
    }
  }

  function handlePrint() {
    const original = document.title;
    if (printTitle) document.title = printTitle;
    window.print();
    setTimeout(() => { document.title = original; }, 100);
  }

  return (
    <div className="flex items-center gap-2" data-print-hide>
      {csv && (
        <Button
          variant="outline"
          size="sm"
          loading={busyCsv}
          onClick={handleCsv}
          leftIcon={<TableCellsIcon className="h-4 w-4" />}
        >
          CSV
        </Button>
      )}
      {pdf && (
        <Button
          variant="outline"
          size="sm"
          loading={busyPdf}
          onClick={handlePdf}
          leftIcon={<DocumentTextIcon className="h-4 w-4" />}
        >
          PDF
        </Button>
      )}
      {showPrint && (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          leftIcon={<PrinterIcon className="h-4 w-4" />}
        >
          Print
        </Button>
      )}
    </div>
  );
}
