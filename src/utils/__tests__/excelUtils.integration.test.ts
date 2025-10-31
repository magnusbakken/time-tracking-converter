/**
 * Integration tests for Excel import/export functionality
 *
 * These tests verify the complete workflow from Workforce import to Dynamics export:
 * 1. Read Workforce file using excelUtils.readFile()
 * 2. Filter rows for a specific week using dateUtils.filterRowsToWeek()
 * 3. Transform to Dynamics format using transformUtils.transformToDynamics()
 * 4. Export to XLSX using excelUtils.exportXlsx()
 *
 * IMPORTANT: These tests have ZERO dependency on the XLSX library. They use only the
 * public API functions from the application. When we replace the XLSX library, these
 * tests will continue to work without any modification, verifying that the behavior
 * remains the same.
 *
 * The tests compare the actual output with expected output by doing a binary comparison
 * of the generated files.
 */

import { describe, it, expect } from 'vitest';
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
 * Create a File-like object from a filesystem path (for testing).
 * In Node.js environment, we need to add the arrayBuffer() method manually.
 */
function createFileFromPath(filePath: string): File {
  const buffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const file = new File([buffer], fileName, {
    type: filePath.endsWith('.xlsx')
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/vnd.ms-excel',
  });

  // In Node.js/jsdom, File.prototype.arrayBuffer might not be implemented
  // Add it if it's missing
  if (!file.arrayBuffer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (file as any).arrayBuffer = () => {
      return Promise.resolve(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      );
    };
  }

  return file;
}

/**
 * Convert a Blob to a Buffer for comparison
 */
async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Compare two files byte-by-byte
 */
function compareFiles(expected: Buffer, actual: Buffer): { match: boolean; message: string } {
  if (expected.length !== actual.length) {
    return {
      match: false,
      message: `File size mismatch: expected ${expected.length} bytes, got ${actual.length} bytes`,
    };
  }

  if (Buffer.compare(expected, actual) === 0) {
    return {
      match: true,
      message: 'Files are identical',
    };
  }

  return {
    match: false,
    message: 'Files differ in content',
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
      // No test cases found. To add test cases:
      // 1. Create a directory in the fixtures folder
      // 2. Add workforce-input.xlsx (or .xls)
      // 3. Add expected-output.xlsx
      // 4. Add config.json with the week start date
      // See fixtures/README.md for more details.
    });
  }

  testCases.forEach((testCaseName) => {
    describe(`Test Case: ${testCaseName}`, () => {
      const testCaseDir = path.join(FIXTURES_DIR, testCaseName);
      const configPath = path.join(testCaseDir, 'config.json');

      // Find input file (try both .xlsx and .xls)
      const inputFiles = fs
        .readdirSync(testCaseDir)
        .filter(
          (f) => f.startsWith('workforce-input') && (f.endsWith('.xlsx') || f.endsWith('.xls'))
        );

      const inputFile = inputFiles[0];
      const inputPath = inputFile ? path.join(testCaseDir, inputFile) : null;

      const expectedPath = path.join(testCaseDir, 'expected-output.xlsx');

      it('should have all required files', () => {
        expect(fs.existsSync(configPath), `Missing config.json in ${testCaseName}`).toBe(true);
        expect(
          inputPath && fs.existsSync(inputPath),
          `Missing workforce-input file in ${testCaseName}`
        ).toBe(true);
        expect(fs.existsSync(expectedPath), `Missing expected-output.xlsx in ${testCaseName}`).toBe(
          true
        );
      });

      if (
        !inputPath ||
        !fs.existsSync(configPath) ||
        !fs.existsSync(inputPath) ||
        !fs.existsSync(expectedPath)
      ) {
        return; // Skip further tests if files are missing
      }

      it('should transform Workforce input to match expected Dynamics output', async () => {
        // Read config
        const configContent = fs.readFileSync(configPath, 'utf-8');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const config: TestConfig = JSON.parse(configContent);

        // Step 1: Read Workforce input file using excelUtils.readFile()
        // All date/time parsing happens inside readFile()
        const inputFile = createFileFromPath(inputPath);
        const { rows } = await readFile(inputFile);
        expect(rows.length).toBeGreaterThan(0);

        // Debug: Check what dates were parsed and what was in the raw data
        const rowsWithDates = rows.filter((r) => r.date);
        const rowsWithoutDates = rows.filter((r) => !r.date);
        const parsedDates = rowsWithDates
          .map((r) => r.date?.toISOString().split('T')[0])
          .filter((d): d is string => d !== undefined);
        const uniqueDates = [...new Set(parsedDates)].sort();

        // Step 2: Filter rows for the specified week using dateUtils.filterRowsToWeek()
        // No XLSX dependency - dates are already parsed as Date objects
        const filteredRows = filterRowsToWeek(rows, config.weekStartIso);

        if (filteredRows.length === 0) {
          const debugInfo = [
            `No rows found for week starting ${config.weekStartIso}.`,
            `Total rows read: ${rows.length}`,
            `Rows with valid dates: ${rowsWithDates.length}`,
            `Rows with null dates: ${rowsWithoutDates.length}`,
            `Parsed dates: ${uniqueDates.length > 0 ? uniqueDates.join(', ') : 'none'}`,
            ``,
            `First few rows:`,
            ...rows
              .slice(0, 3)
              .map(
                (r, i) =>
                  `  Row ${i + 1}: date=${r.date ? r.date.toISOString() : 'null'}, ` +
                  `start=${r.startTimeMinutes}, end=${r.endTimeMinutes}`
              ),
          ].join('\n');

          throw new Error(debugInfo);
        }

        expect(filteredRows.length).toBeGreaterThan(0);

        // Step 3: Transform to Dynamics format using transformUtils.transformToDynamics()
        // No XLSX dependency - times are already parsed as numbers (minutes since midnight)
        const dynamicsRows = transformToDynamics(filteredRows, config.weekStartIso);
        expect(dynamicsRows.length).toBe(2); // Should have work + lunch rows

        // Step 4: Export to XLSX blob using excelUtils.exportXlsx()
        const actualBlob = exportXlsx(dynamicsRows, DYNAMICS_HEADERS);
        expect(actualBlob).toBeInstanceOf(Blob);

        // Step 5: Convert actual output to buffer
        const actualBuffer = await blobToBuffer(actualBlob);

        // Step 6: Read expected output file as buffer
        const expectedBuffer = fs.readFileSync(expectedPath);

        // Step 7: Compare the files byte-by-byte
        const comparison = compareFiles(expectedBuffer, actualBuffer);

        // If comparison fails, the expect below will show the message
        // (console statements are disabled in tests for cleaner output)

        expect(comparison.match, comparison.message).toBe(true);
      });
    });
  });
});
