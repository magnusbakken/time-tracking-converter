import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import { exportXlsx } from '../excelUtils';
import { transformToDynamics, DYNAMICS_HEADERS } from '../transformUtils';

// Get the directory of this test file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

interface TestConfig {
  weekStartIso: string;
  description?: string;
}

interface RawRow {
  date: unknown;
  startTime: unknown;
  endTime: unknown;
}

interface FilteredRow {
  row: RawRow;
  date: dayjs.Dayjs;
}

/**
 * Read Excel file from filesystem (for testing)
 */
function readExcelFile(filePath: string): { workbook: XLSX.WorkBook; rawRows: RawRow[] } {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const firstSheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[firstSheetName];

  // Fixed columns: I (8), N (13), T (19). Data starts at row 13 (index 12).
  const ref = ws['!ref'] ?? 'A1:A1';
  const range = XLSX.utils.decode_range(ref);
  const startRow = Math.max(12, range.s.r); // 0-based index for row 13
  const COL_I = 8; // Arbeidsdato (Date)
  const COL_N = 13; // Inntid (Start time)
  const COL_T = 19; // Ut-tid (End time)

  const rows: RawRow[] = [];
  for (let r = startRow; r <= range.e.r; r++) {
    const dCell = ws[XLSX.utils.encode_cell({ r, c: COL_I })];
    const sCell = ws[XLSX.utils.encode_cell({ r, c: COL_N })];
    const eCell = ws[XLSX.utils.encode_cell({ r, c: COL_T })];

    const dVal = dCell ? dCell.v : '';
    const sVal = sCell ? sCell.v : '';
    const eVal = eCell ? eCell.v : '';

    const isAllEmpty =
      (dVal === '' || dVal === null || dVal === undefined) &&
      (sVal === '' || sVal === null || sVal === undefined) &&
      (eVal === '' || eVal === null || eVal === undefined);

    if (isAllEmpty) continue;

    rows.push({ date: dVal, startTime: sVal, endTime: eVal });
  }

  return { workbook, rawRows: rows };
}

/**
 * Filter and parse rows for a specific week
 */
function filterRowsForWeek(rawRows: RawRow[], weekStartIso: string): FilteredRow[] {
  const weekStart = dayjs(weekStartIso);
  const weekEnd = weekStart.add(6, 'day');

  const filtered: FilteredRow[] = [];

  for (const row of rawRows) {
    let date: dayjs.Dayjs | null = null;

    // Parse date from various formats
    if (typeof row.date === 'number') {
      // Excel serial date
      const excelDate = XLSX.SSF.parse_date_code(row.date);
      if (excelDate) {
        date = dayjs(new Date(excelDate.y, excelDate.m - 1, excelDate.d));
      }
    } else if (typeof row.date === 'string') {
      date = dayjs(row.date);
    } else if (row.date instanceof Date) {
      date = dayjs(row.date);
    }

    if (!date || !date.isValid()) continue;

    // Check if date is in the selected week
    if (date.isSame(weekStart, 'day') || date.isSame(weekEnd, 'day') || (date.isAfter(weekStart) && date.isBefore(weekEnd))) {
      filtered.push({ row, date });
    }
  }

  return filtered;
}

/**
 * Read expected output file and parse to data rows
 */
function readExpectedOutput(filePath: string): Record<string, unknown>[] {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { 
    header: DYNAMICS_HEADERS as unknown as string[],
    defval: '',
    raw: false // Keep as strings for comparison
  });
  
  // Skip the header row (first row will be the headers themselves)
  return data.slice(1);
}

/**
 * Parse actual output blob and convert to data rows
 */
function parseActualOutput(blob: Blob): Record<string, unknown>[] {
  const buffer = Buffer.from(blob as unknown as ArrayBuffer);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { 
    header: DYNAMICS_HEADERS as unknown as string[],
    defval: '',
    raw: false // Keep as strings for comparison
  });
  
  // Skip the header row
  return data.slice(1);
}

/**
 * Normalize values for comparison (handle number/string conversions, empty strings)
 */
function normalizeValue(value: unknown): string | number {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  // Try to parse as number if it looks like one
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num) && value.trim() !== '') {
      return num;
    }
  }
  
  return String(value);
}

/**
 * Compare two data rows (expected vs actual)
 */
function compareRows(expected: Record<string, unknown>[], actual: Record<string, unknown>[]): { match: boolean; differences: string[] } {
  const differences: string[] = [];

  if (expected.length !== actual.length) {
    differences.push(`Row count mismatch: expected ${expected.length}, got ${actual.length}`);
  }

  const rowCount = Math.max(expected.length, actual.length);
  
  for (let i = 0; i < rowCount; i++) {
    const expRow = expected[i] || {};
    const actRow = actual[i] || {};

    // Compare each column
    for (const col of DYNAMICS_HEADERS) {
      const expVal = normalizeValue(expRow[col]);
      const actVal = normalizeValue(actRow[col]);

      if (expVal !== actVal) {
        differences.push(`Row ${i + 1}, Column "${col}": expected "${expVal}", got "${actVal}"`);
      }
    }
  }

  return {
    match: differences.length === 0,
    differences,
  };
}

/**
 * Get all test case directories
 */
function getTestCases(): string[] {
  if (!fs.existsSync(FIXTURES_DIR)) {
    return [];
  }

  return fs
    .readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((name) => !name.startsWith('.') && name !== 'README.md')
    .sort();
}

describe('Excel Import/Export Integration Tests', () => {
  const testCases = getTestCases();

  if (testCases.length === 0) {
    it.skip('No test cases found in fixtures directory', () => {
      console.log(`
No test cases found. To add test cases:
1. Create a directory in ${FIXTURES_DIR}
2. Add workforce-input.xlsx (or .xls)
3. Add expected-output.xlsx
4. Add config.json with the week start date

See ${path.join(FIXTURES_DIR, 'README.md')} for more details.
      `);
    });
  }

  testCases.forEach((testCaseName) => {
    describe(`Test Case: ${testCaseName}`, () => {
      const testCaseDir = path.join(FIXTURES_DIR, testCaseName);
      const configPath = path.join(testCaseDir, 'config.json');

      // Find input file (try both .xlsx and .xls)
      const inputFiles = fs
        .readdirSync(testCaseDir)
        .filter((f) => f.startsWith('workforce-input') && (f.endsWith('.xlsx') || f.endsWith('.xls')));
      
      const inputFile = inputFiles[0];
      const inputPath = inputFile ? path.join(testCaseDir, inputFile) : null;

      const expectedPath = path.join(testCaseDir, 'expected-output.xlsx');

      it('should have all required files', () => {
        expect(fs.existsSync(configPath), `Missing config.json in ${testCaseName}`).toBe(true);
        expect(inputPath && fs.existsSync(inputPath), `Missing workforce-input file in ${testCaseName}`).toBe(true);
        expect(fs.existsSync(expectedPath), `Missing expected-output.xlsx in ${testCaseName}`).toBe(true);
      });

      if (!inputPath || !fs.existsSync(configPath) || !fs.existsSync(inputPath) || !fs.existsSync(expectedPath)) {
        return; // Skip further tests if files are missing
      }

      it('should transform Workforce input to match expected Dynamics output', () => {
        // Read config
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const config: TestConfig = JSON.parse(configContent);

        if (config.description) {
          console.log(`  Description: ${config.description}`);
        }

        // Step 1: Read Workforce input file
        const { rawRows } = readExcelFile(inputPath);
        expect(rawRows.length).toBeGreaterThan(0);

        // Step 2: Filter rows for the specified week
        const filteredRows = filterRowsForWeek(rawRows, config.weekStartIso);
        expect(filteredRows.length).toBeGreaterThan(0);

        // Step 3: Transform to Dynamics format
        const dynamicsRows = transformToDynamics(filteredRows, config.weekStartIso, XLSX);
        expect(dynamicsRows.length).toBe(2); // Should have work + lunch rows

        // Step 4: Export to XLSX blob
        const blob = exportXlsx(dynamicsRows, DYNAMICS_HEADERS);
        expect(blob).toBeInstanceOf(Blob);

        // Step 5: Parse actual output
        const actualRows = parseActualOutput(blob);

        // Step 6: Read expected output
        const expectedRows = readExpectedOutput(expectedPath);

        // Step 7: Compare
        const comparison = compareRows(expectedRows, actualRows);
        
        if (!comparison.match) {
          console.log('\nDifferences found:');
          comparison.differences.forEach((diff) => console.log(`  - ${diff}`));
        }

        expect(comparison.match, `Output does not match expected (${comparison.differences.length} differences)`).toBe(true);
      });
    });
  });
});
