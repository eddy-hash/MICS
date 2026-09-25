'use client';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { Button, type ButtonProps } from './Button';

interface PrintButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Optional title shown in the browser print dialog */
  documentTitle?: string;
}

/**
 * Triggers the browser print dialog. The page uses @media print CSS
 * to strip navigation, chrome, and colors — output is a clean report.
 */
export function PrintButton({
  documentTitle,
  label = 'Print',
  ...rest
}: PrintButtonProps) {
  function handlePrint() {
    // Optionally change the document title so the saved PDF
    // gets a nice filename (browsers use <title> as default name)
    const originalTitle = document.title;
    if (documentTitle) {
      document.title = documentTitle;
    }
    window.print();
    // Restore after the dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      leftIcon={<PrinterIcon className="h-4 w-4" />}
      {...rest}
    >
      {label}
    </Button>
  );
}
