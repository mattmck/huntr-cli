/**
 * Shared CLI options for list commands (boards, jobs, activities).
 * Provides consistent flag parsing and validation across all list subcommands.
 */

export type OutputFormat = 'table' | 'json' | 'csv' | 'pdf' | 'excel';

export interface ListOptions {
  /** Output format: table (default), json, csv, pdf, or excel */
  format: OutputFormat;
  /** Number of days to filter to (activities only, default: all) */
  days?: number;
  /** Action types to filter (activities only, comma-separated) */
  types?: string[];
  /** Selected fields to include in output (comma-separated) */
  fields?: string[];
}

/**
 * Parses common list options from CLI arguments.
 * Supports aliases: -f/--format, -d/--days, --json (legacy compatibility), --fields.
 */
export function parseListOptions(opts: Record<string, unknown>): ListOptions {
  let format: OutputFormat = 'table';

  // Handle legacy --json flag
  if (opts.json) {
    format = 'json';
  }
  // Handle new --format flag (takes precedence over --json)
  if (opts.format) {
    const fmt = String(opts.format).toLowerCase();
    if (!['table', 'json', 'csv', 'pdf', 'excel'].includes(fmt)) {
      throw new Error(`Invalid format: ${fmt}. Must be table, json, csv, pdf, or excel.`);
    }
    format = fmt as OutputFormat;
  }

  let days: number | undefined;
  if (opts.days) {
    const d = parseInt(String(opts.days), 10);
    if (isNaN(d) || d < 1 || d > 365) {
      throw new Error('Days must be a number between 1 and 365');
    }
    days = d;
  }

  // Legacy --week flag for activities (maps to 7 days)
  if (opts.week && !days) {
    days = 7;
  }

  let types: string[] | undefined;
  if (opts.types) {
    types = String(opts.types)
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  let fields: string[] | undefined;
  if (opts.fields) {
    fields = String(opts.fields)
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);
  }

  return { format, days, types, fields };
}

/**
 * Formats table output with consistent column widths.
 */
export function formatTable<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return '';

  const keys = Object.keys(rows[0]);
  const colWidths: Record<string, number> = {};

  // Calculate column widths
  for (const key of keys) {
    colWidths[key] = key.length;
    for (const row of rows) {
      const val = String(row[key] ?? '');
      colWidths[key] = Math.max(colWidths[key], val.length);
    }
  }

  // Format header
  const header = keys.map(k => k.padEnd(colWidths[k])).join('  ');
  const divider = keys.map(k => '─'.repeat(colWidths[k])).join('  ');

  // Format rows
  const lines = [header, divider];
  for (const row of rows) {
    const line = keys.map(k => String(row[k] ?? '').padEnd(colWidths[k])).join('  ');
    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Converts array of objects to CSV with proper escaping.
 */
export function formatCsv<T extends Record<string, unknown>>(rows: T[], headers?: string[]): string {
  if (rows.length === 0) return headers ? headers.join(',') : '';

  const keys = headers || Object.keys(rows[0]);
  const lines = [keys.map(escapeCsvField).join(',')];

  for (const row of rows) {
    const values = keys.map(k => {
      const val = row[k];
      return escapeCsvField(String(val ?? ''));
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Validates and filters fields based on available fields.
 * If no fields are requested, returns all available fields.
 * Throws an error if requested fields don't exist.
 */
export function validateFields(availableFields: string[], requestedFields?: string[]): string[] {
  if (!requestedFields || requestedFields.length === 0) {
    return availableFields;
  }

  const invalid = requestedFields.filter(f => !availableFields.includes(f));
  if (invalid.length > 0) {
    const invalidStr = invalid.join(', ');
    const availableStr = availableFields.join(', ');
    throw new Error(
      `Unknown field(s): ${invalidStr}\nAvailable fields: ${availableStr}`,
    );
  }

  return requestedFields;
}

/**
 * Formats table output with specific fields and consistent column widths.
 * @param rows Data rows
 * @param headers Field names to include (in order)
 */
export function formatTableWithFields<T extends Record<string, unknown>>(
  rows: T[],
  headers: string[],
): string {
  if (rows.length === 0) return '';

  const colWidths: Record<string, number> = {};

  // Calculate column widths
  for (const key of headers) {
    colWidths[key] = key.length;
    for (const row of rows) {
      const val = String(row[key] ?? '');
      colWidths[key] = Math.max(colWidths[key], val.length);
    }
  }

  // Format header
  const header = headers.map(k => k.padEnd(colWidths[k])).join('  ');
  const divider = headers.map(k => '─'.repeat(colWidths[k])).join('  ');

  // Format rows
  const lines = [header, divider];
  for (const row of rows) {
    const line = headers.map(k => String(row[k] ?? '').padEnd(colWidths[k])).join('  ');
    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Formats CSV output with specific fields.
 * @param rows Data rows
 * @param headers Field names to include (in order)
 */
export function formatCsvWithFields<T extends Record<string, unknown>>(
  rows: T[],
  headers: string[],
): string {
  if (rows.length === 0) return headers.join(',');

  const lines = [headers.map(escapeCsvField).join(',')];

  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h];
      return escapeCsvField(String(val ?? ''));
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Formats JSON output with specific fields.
 * @param rows Data rows
 * @param headers Field names to include (in order)
 */
export function formatJsonWithFields<T extends Record<string, unknown>>(
  rows: T[],
  headers: string[],
): string {
  const filtered = rows.map(row => {
    const obj: Record<string, unknown> = {};
    for (const header of headers) {
      obj[header] = row[header];
    }
    return obj;
  });
  return JSON.stringify(filtered, null, 2);
}

/**
 * Formats PDF output with specific fields.
 * Requires pdfkit to be installed.
 * @param rows Data rows
 * @param headers Field names to include (in order)
 * @param title Optional title for the PDF
 */
export function formatPdf<T extends Record<string, unknown>>(
  rows: T[],
  headers: string[],
  title?: string,
): Buffer {
  // Dynamically import pdfkit to avoid hard dependency at load time
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const PDFDocument = require('pdfkit');

  const doc = new PDFDocument({ margin: 40, size: 'letter' });
  const chunks: Buffer[] = [];

  // Collect output
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Title
  if (title) {
    doc.fontSize(16).font('Helvetica-Bold').text(title, { underline: true });
    doc.moveDown();
  }

  // Metadata
  const now = new Date();
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Generated: ${now.toISOString()}`, { lineGap: 5 });
  doc.moveDown();

  // Table header
  const colWidth = (doc.page.width - 80) / headers.length;
  const yStart = doc.y;

  // Header background
  doc.rect(40, yStart, doc.page.width - 80, 25).fill('#e8e8e8');

  // Header text
  doc.fontSize(10).font('Helvetica-Bold').fillColor('black');
  headers.forEach((header, i) => {
    doc.text(header, 40 + i * colWidth + 5, yStart + 5, {
      width: colWidth - 10,
      ellipsis: true,
    });
  });

  doc.moveDown(1.5);

  // Data rows
  doc.font('Helvetica').fontSize(9);
  const rowHeight = 20;

  for (const row of rows) {
    const yRow = doc.y;

    // Alternate row background
    if (rows.indexOf(row) % 2 === 0) {
      doc.rect(40, yRow, doc.page.width - 80, rowHeight).fill('#f5f5f5');
      doc.fillColor('black');
    }

    headers.forEach((header, i) => {
      const val = String(row[header] ?? '');
      doc.text(val, 40 + i * colWidth + 5, yRow + 3, {
        width: colWidth - 10,
        ellipsis: true,
      });
    });

    doc.moveDown(1.2);
  }

  // Footer
  doc.fontSize(9).font('Helvetica').text('huntr-cli', { align: 'center' });

  doc.end();

  return Buffer.concat(chunks);
}

/**
 * Formats Excel output with specific fields.
 * Requires exceljs to be installed.
 * @param rows Data rows
 * @param headers Field names to include (in order)
 * @param title Optional sheet title
 */
export async function formatExcel<T extends Record<string, unknown>>(
  rows: T[],
  headers: string[],
  title?: string,
): Promise<Buffer> {
  // Dynamically import exceljs to avoid hard dependency at load time
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const ExcelJS = require('exceljs');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title || 'Data', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
  });

  // Add header row
  worksheet.addRow(headers);
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'center' };

  // Add data rows
  for (const row of rows) {
    const values = headers.map(h => row[h] ?? '');
    worksheet.addRow(values);
  }

  // Auto-adjust column widths
  headers.forEach((header, i) => {
    let maxLen = header.length;
    for (const row of rows) {
      const val = String(row[header] ?? '');
      maxLen = Math.max(maxLen, val.length);
    }
    const col = worksheet.getColumn(i + 1);
    col.width = Math.min(maxLen + 2, 50); // Cap at 50 chars
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as Buffer;
}
