import ExcelJS from 'exceljs';

/**
 * Represents a parsed time entry row with all values converted to standard types.
 * All parsing happens within excelUtils, so consumers don't need to know about Excel formats.
 */
export interface ParsedRow {
  /** Parsed date as Date object, or null if parsing failed */
  date: Date | null;
  /** Start time in minutes since midnight (0-1439), or null if parsing failed */
  startTimeMinutes: number | null;
  /** End time in minutes since midnight (0-1439), or null if parsing failed */
  endTimeMinutes: number | null;
}

export interface ReadFileResult {
  /** Parsed rows with dates and times already converted to standard types */
  rows: ParsedRow[];
  fileName: string;
  sheetName: string;
}

/**
 * Parse a date value from Excel (serial number or string)
 */
function parseExcelDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;

  // Handle Excel Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Handle Excel serial number
  if (typeof value === 'number') {
    // ExcelJS converts dates to Date objects automatically when reading cells
    // But if we get a number, convert it manually (Excel serial date)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const date = ExcelJS.Workbook.excelDateToJsDate(value) as Date;
    return isNaN(date.getTime()) ? null : date;
  }

  // Handle Norwegian DD.MM.YY or DD.MM.YYYY format
  if (typeof value === 'string') {
    const s = value.trim();
    const m = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})\s*$/.exec(s);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      let year = parseInt(m[3], 10);
      if (m[3].length === 2) year = 2000 + year;

      if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
      if (month < 1 || month > 12) return null;
      if (day < 1) return null;
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const monthLengths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      const maxDay = monthLengths[month - 1];
      if (day > maxDay) return null;

      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    }
  }

  // Fallback: try to parse as date
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse a time value from Excel to minutes since midnight
 * Handles Excel serial numbers, HH:MM, HH.MM formats
 */
function parseExcelTime(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  // Handle Excel Date object (time is stored as fractional day)
  if (value instanceof Date) {
    const hours = value.getHours();
    const minutes = value.getMinutes();
    return hours * 60 + minutes;
  }

  // Handle Excel serial number (time as fraction of day)
  if (typeof value === 'number') {
    // Time values in Excel are 0-1 (fraction of day)
    if (value >= 0 && value <= 1) {
      return Math.round(value * 1440);
    }
    // Could also be a serial date-time, convert and extract time
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const date = ExcelJS.Workbook.excelDateToJsDate(value) as Date;
    if (!isNaN(date.getTime())) {
      return date.getHours() * 60 + date.getMinutes();
    }
    return null;
  }

  // Handle string formats
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  const normalized = raw.replace(',', '.');

  // Match HH.MM or HH:MM
  let m = /^\s*(\d{1,2})[.:](\d{2})\s*$/.exec(normalized);
  let hours: number, minutes: number;
  if (m) {
    hours = parseInt(m[1], 10);
    minutes = parseInt(m[2], 10);
  } else {
    // Fallback: just HH
    m = /^\s*(\d{1,2})\s*$/.exec(normalized);
    if (!m) return null;
    hours = parseInt(m[1], 10);
    minutes = 0;
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * Read Excel/CSV file and extract time entry rows with all values parsed.
 * Fixed columns: I (8), N (13), T (19). Data starts at row 13 (index 12).
 *
 * All Excel-specific parsing happens here. Consumers receive clean Date and number values.
 */
export async function readFile(file: File): Promise<ReadFileResult> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  const firstSheetName = worksheet.name;

  // Fixed columns: I (9), N (14), T (20). Data starts at row 13.
  // Note: ExcelJS uses 1-based indexing for rows and columns
  const startRow = 13;
  const COL_I = 9; // Arbeidsdato (Date) - Column I
  const COL_N = 14; // Inntid (Start time) - Column N
  const COL_T = 20; // Ut-tid (End time) - Column T

  const rows: ParsedRow[] = [];

  // Iterate through rows starting from row 13
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) return;

    const dCell = row.getCell(COL_I);
    const sCell = row.getCell(COL_N);
    const eCell = row.getCell(COL_T);

    const dVal = dCell.value;
    const sVal = sCell.value;
    const eVal = eCell.value;

    const isAllEmpty =
      (dVal === null || dVal === undefined || dVal === '') &&
      (sVal === null || sVal === undefined || sVal === '') &&
      (eVal === null || eVal === undefined || eVal === '');

    if (isAllEmpty) return; // Skip empty rows but do not stop scanning

    // Parse all values immediately
    rows.push({
      date: parseExcelDate(dVal),
      startTimeMinutes: parseExcelTime(sVal),
      endTimeMinutes: parseExcelTime(eVal),
    });
  });

  return {
    rows,
    fileName: file.name,
    sheetName: firstSheetName,
  };
}

/**
 * Export rows to CSV
 */
export function exportCsv(rows: Record<string, unknown>[], headers: readonly string[]): Blob {
  // Convert to CSV manually since ExcelJS doesn't have a direct CSV export from JSON
  const csvLines: string[] = [];

  // Add header row
  csvLines.push(headers.map((h) => `"${h}"`).join(','));

  // Add data rows
  for (const row of rows) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      // Convert to string safely
      const stringValue =
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value);
      // Escape quotes and wrap in quotes
      return `"${stringValue.replace(/"/g, '""')}"`;
    });
    csvLines.push(values.join(','));
  }

  const csv = csvLines.join('\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Export rows to XLSX
 */
export async function exportXlsx(
  rows: Record<string, unknown>[],
  headers: readonly string[]
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Import');

  // Add header row
  worksheet.addRow(headers as string[]);

  // Add data rows
  for (const row of rows) {
    const values = headers.map((header) => row[header]);
    worksheet.addRow(values);
  }

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/octet-stream' });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
