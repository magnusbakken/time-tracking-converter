import * as XLSX from 'xlsx';

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

interface ParsedDateCode {
  y: number;
  m: number;
  d: number;
  H?: number;
  M?: number;
  S?: number;
}

/**
 * Parse a date value from Excel (serial number or string)
 */
function parseExcelDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;

  // Handle Excel serial number
  if (typeof value === 'number') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const parsed = XLSX.SSF.parse_date_code(value) as ParsedDateCode | undefined;
    if (!parsed) return null;
    const date = new Date(parsed.y, parsed.m - 1, parsed.d);
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
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value as string);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse a time value from Excel to minutes since midnight
 * Handles Excel serial numbers, HH:MM, HH.MM formats
 */
function parseExcelTime(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  // Handle Excel serial number
  if (typeof value === 'number') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const parsed = XLSX.SSF.parse_date_code(value) as ParsedDateCode | undefined;
    if (parsed && Number.isFinite(parsed.H) && Number.isFinite(parsed.M)) {
      return (parsed.H ?? 0) * 60 + (parsed.M ?? 0);
    }
    if (value >= 0 && value <= 1) {
      return Math.round(value * 1440);
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
  const wb = XLSX.read(buffer, { type: 'array' });

  const firstSheetName = wb.SheetNames[0];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const ws = wb.Sheets[firstSheetName];

  // Fixed columns: I (8), N (13), T (19). Data starts at row 13 (index 12).
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const ref = ws['!ref'] ?? 'A1:A1';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const range = XLSX.utils.decode_range(ref);
  const startRow = Math.max(12, range.s.r); // 0-based index for row 13
  const COL_I = 8; // Arbeidsdato (Date)
  const COL_N = 13; // Inntid (Start time)
  const COL_T = 19; // Ut-tid (End time)

  const rows: ParsedRow[] = [];
  for (let r = startRow; r <= range.e.r; r++) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const dCell = ws[XLSX.utils.encode_cell({ r, c: COL_I })];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const sCell = ws[XLSX.utils.encode_cell({ r, c: COL_N })];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const eCell = ws[XLSX.utils.encode_cell({ r, c: COL_T })];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const dVal = dCell ? dCell.v : '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const sVal = sCell ? sCell.v : '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const eVal = eCell ? eCell.v : '';

    const isAllEmpty =
      (dVal === '' || dVal === null || dVal === undefined) &&
      (sVal === '' || sVal === null || sVal === undefined) &&
      (eVal === '' || eVal === null || eVal === undefined);

    if (isAllEmpty) continue; // Skip empty rows but do not stop scanning

    // Parse all values immediately
    rows.push({
      date: parseExcelDate(dVal),
      startTimeMinutes: parseExcelTime(sVal),
      endTimeMinutes: parseExcelTime(eVal),
    });
  }

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
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers as string[] });
  const csv = XLSX.utils.sheet_to_csv(ws);
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Export rows to XLSX
 */
export function exportXlsx(rows: Record<string, unknown>[], headers: readonly string[]): Blob {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers as string[] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/octet-stream' });
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
