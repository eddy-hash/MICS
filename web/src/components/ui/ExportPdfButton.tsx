'use client';
import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button, type ButtonProps } from './Button';
import { notify } from '@/lib/toast';
import { buildPdf, type PdfOptions } from '@/lib/pdf';

interface ExportPdfButtonProps extends Omit<ButtonProps, 'onClick'> {
  build: () => PdfOptions | Promise<PdfOptions>;
  filename: string;
  label?: string;
}

export function ExportPdfButton({
  build,
  filename,
  label = 'Export PDF',
  ...rest
}: ExportPdfButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const opts = await build();
      const doc = buildPdf(opts);
      doc.save(filename);
      notify.success('PDF downloaded', { subMessage: filename });
    } catch (e) {
      console.error('[export-pdf]', e);
      notify.error('Could not export PDF', { subMessage: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      loading={busy}
      onClick={handleExport}
      leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
      {...rest}
    >
      {busy ? 'Generating…' : label}
    </Button>
  );
}
