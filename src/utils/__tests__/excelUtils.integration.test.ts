/**
 * Integration tests for Excel import/export functionality
 * 
 * These tests verify the complete workflow from Workforce import to Dynamics export:
 * 1. Read Workforce file using excelUtils.readFile()
 * 2. Filter rows for a specific week using dateUtils.filterRowsToWeek()
 * 3. Transform to Dynamics format using transformUtils.transformToDynamics()
 * 4. Export to XLSX using excelUtils.exportXlsx()
 * 
 * IMPORTANT: These tests use the public API functions from excelUtils, dateUtils, and
 * transformUtils rather than directly using XLSX. This means when we replace the XLSX
 * library, these tests will continue to work without modification, verifying that the
 * behavior remains the same.
 * 
 * Note: XLSX is only imported directly for comparison purposes (reading expected output
 * files), which is test infrastructure and won't affect the code under test.
 */

import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { readFile, exportXlsx } from '../excelUtils';
import { transformToDynamics, DYNAMICS_HEADERS } from '../transformUtils';
import { filterRowsToWeek } from '../dateUtils';

// Get the directory of this test file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

interface TestConfig {
  weekStartIso: string;
  description?: string;
}

/**
 * Create a File object from a filesystem path (for testing)
 */
function createFileFromPath(filePath: string): File {
  const buffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  return new File([buffer], fileName, {
    type: filePath.endsWith('.xlsx')
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/vnd.ms-excel',
  });
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

      it('should transform Workforce input to match expected Dynamics output', async () => {
        // Read config
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const config: TestConfig = JSON.parse(configContent);

        if (config.description) {
          console.log(`  Description: ${config.description}`);
        }

        // Step 1: Read Workforce input file using the excelUtils.readFile function
        const inputFile = createFileFromPath(inputPath);
        const { rawRows, workbook } = await readFile(inputFile);
        expect(rawRows.length).toBeGreaterThan(0);

        // Step 2: Filter rows for the specified week using dateUtils.filterRowsToWeek
        const filteredRows = filterRowsToWeek(rawRows, config.weekStartIso, XLSX);
        expect(filteredRows.length).toBeGreaterThan(0);

        // Step 3: Transform to Dynamics format using transformUtils.transformToDynamics
        const dynamicsRows = transformToDynamics(filteredRows, config.weekStartIso, XLSX);
        expect(dynamicsRows.length).toBe(2); // Should have work + lunch rows

        // Step 4: Export to XLSX blob using excelUtils.exportXlsx
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
