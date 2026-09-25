import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Brand colors (RGB) ───
const BRAND = {
  teal: [13, 148, 136] as [number, number, number],
  tealLight: [20, 184, 166] as [number, number, number],
  cyan: [6, 182, 212] as [number, number, number],
  slate900: [15, 23, 42] as [number, number, number],
  slate500: [100, 116, 139] as [number, number, number],
  slate200: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  rose: [225, 29, 72] as [number, number, number],
  violet: [139, 92, 246] as [number, number, number],
};

export interface PdfHeader {
  title: string;
  subtitle?: string;
  reference?: string;
}

export interface PdfSection {
  heading?: string;
  rows: Array<[string, string]>; // [label, value]
}

export interface PdfTable {
  heading?: string;
  columns: string[];
  rows: string[][];
}

export interface PdfOptions {
  header: PdfHeader;
  sections?: PdfSection[];
  tables?: PdfTable[];
  footerNote?: string;
}

// ─── Status → color mapping ───
export function statusColor(status: string): [number, number, number] {
  const s = status.toUpperCase();
  if (s.includes('APPROVED') || s.includes('PAID')) return BRAND.emerald;
  if (s.includes('PENDING') || s.includes('REVIEW')) return BRAND.amber;
  if (s.includes('REJECTED') || s.includes('DEFAULTED')) return BRAND.rose;
  if (s.includes('DISBURSED')) return BRAND.violet;
  if (s.includes('CANCELLED')) return BRAND.slate500;
  return BRAND.slate500;
}

/**
 * Build a branded PDF with a teal header band, metadata, sections, and tables.
 * Returns the jsPDF instance — caller decides when to save.
 */
export function buildPdf(opts: PdfOptions): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ─── Header band ───
  doc.setFillColor(...BRAND.teal);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Accent stripe (cyan)
  doc.setFillColor(...BRAND.cyan);
  doc.rect(0, 38, pageWidth, 2, 'F');

  // Brand mark (small square)
  doc.setFillColor(...BRAND.white);
  doc.roundedRect(15, 12, 16, 16, 3, 3, 'F');
  doc.setTextColor(...BRAND.teal);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('N', 23, 23, { align: 'center' });

  // Brand name
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NaedCredit', 36, 22);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 245, 240);
  doc.text('Loan Management Platform', 36, 28);

  // Right-side meta
  doc.setFontSize(7);
  doc.setTextColor(200, 240, 235);
  doc.text(`Generated: ${new Date().toLocaleString('en-TZ')}`, pageWidth - 15, 18, { align: 'right' });
  if (opts.header.reference) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Ref: ${opts.header.reference}`, pageWidth - 15, 24, { align: 'right' });
  }

  // ─── Title block ───
  let y = 52;
  doc.setTextColor(...BRAND.slate900);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.header.title, 15, y);

  if (opts.header.subtitle) {
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.slate500);
    doc.text(opts.header.subtitle, 15, y);
  }

  y += 10;

  // ─── Sections ───
  if (opts.sections) {
    for (const sec of opts.sections) {
      if (sec.heading) {
        y += 2;
        doc.setFillColor(...BRAND.slate200);
        doc.rect(15, y - 4, pageWidth - 30, 0.3, 'F');
        y += 4;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND.slate900);
        doc.text(sec.heading.toUpperCase(), 15, y);
        y += 7;
      }

      // Two-column label/value rows
      doc.setFontSize(9.5);
      const colWidth = (pageWidth - 30) / 2;
      for (let i = 0; i < sec.rows.length; i += 2) {
        const [l1, v1] = sec.rows[i];
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BRAND.slate500);
        doc.text(l1, 15, y);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND.slate900);
        doc.text(v1, 15 + colWidth, y, { maxWidth: colWidth - 5 });

        if (i + 1 < sec.rows.length) {
          const [l2, v2] = sec.rows[i + 1];
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...BRAND.slate500);
          doc.text(l2, 15 + colWidth, y);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...BRAND.slate900);
          doc.text(v2, 15 + 2 * colWidth, y, { maxWidth: colWidth - 5 });
        }

        y += 7;

        if (y > pageHeight - 40) {
          doc.addPage();
          y = 20;
        }
      }
      y += 3;
    }
  }

  // ─── Tables ───
  if (opts.tables) {
    for (const tbl of opts.tables) {
      if (tbl.heading) {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 20;
        }
        y += 3;
        doc.setFillColor(...BRAND.slate200);
        doc.rect(15, y - 4, pageWidth - 30, 0.3, 'F');
        y += 4;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND.slate900);
        doc.text(tbl.heading.toUpperCase(), 15, y);
        y += 3;
      }

      autoTable(doc, {
        startY: y + 2,
        head: [tbl.columns],
        body: tbl.rows,
        margin: { left: 15, right: 15 },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: BRAND.slate200,
          lineWidth: 0.1,
          textColor: BRAND.slate900,
        },
        headStyles: {
          fillColor: BRAND.teal,
          textColor: BRAND.white,
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didParseCell: (data) => {
          // Color the status column if the header contains "Status"
          if (
            data.section === 'body' &&
            tbl.columns[data.column.index]?.toLowerCase().includes('status')
          ) {
            const color = statusColor(String(data.cell.raw));
            data.cell.styles.textColor = color;
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      // @ts-expect-error — lastAutoTable is added by the plugin at runtime
      y = (doc.lastAutoTable?.finalY ?? y) + 10;
    }
  }

  // ─── Footer note ───
  if (opts.footerNote) {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...BRAND.slate500);
    doc.text(opts.footerNote, 15, y, { maxWidth: pageWidth - 30 });
  }

  // ─── Page numbers ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.slate500);

    doc.text('NaedCredit · Tanzania', 15, pageHeight - 8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 15,
      pageHeight - 8,
      { align: 'right' },
    );
  }

  return doc;
}

// ─── Formatters ───
export function money(n: number, currency = 'TZS'): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function dateLong(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
