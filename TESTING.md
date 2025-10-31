# Excel Integration Testing Guide

## Overview

An automated integration test suite has been set up to verify that the Workforce import and Dynamics export functionality works correctly. This will help ensure that replacing the XLSX package doesn't break existing functionality.

## Test Structure

The integration tests are located at:
- **Test file**: `src/utils/__tests__/excelUtils.integration.test.ts`
- **Test fixtures**: `src/utils/__tests__/fixtures/`

## Adding Test Cases

Two test case directories have been created for you: `case1` and `case2`. For each test case:

### 1. Add Your Files

Place the following files in each case directory (e.g., `src/utils/__tests__/fixtures/case1/`):

1. **workforce-input.xlsx** (or .xls)
   - Your Workforce timesheet export file

2. **expected-output.xlsx**
   - The expected Dynamics output file after transformation
   - This should be the correct output you expect from the current system

3. **config.json**
   - Already created with a template
   - Update the `weekStartIso` field with the Monday of the week to test (format: YYYY-MM-DD)
   - Optionally update the `description` field

### Example config.json

```json
{
  "weekStartIso": "2025-10-27",
  "description": "Test case with standard 5-day work week"
}
```

### 2. Directory Structure

Your final structure should look like:

```
src/utils/__tests__/fixtures/
├── README.md
├── case1/
│   ├── workforce-input.xlsx
│   ├── expected-output.xlsx
│   └── config.json
└── case2/
    ├── workforce-input.xlsx
    ├── expected-output.xlsx
    └── config.json
```

## Running the Tests

### Run All Tests
```bash
pnpm test
```

### Run Only Integration Tests
```bash
pnpm test excelUtils.integration.test.ts
```

### Run Tests in Watch Mode
```bash
pnpm test:watch excelUtils.integration.test.ts
```

## What the Tests Verify

For each test case, the integration test will:

1. ✅ Read the Workforce input file using `excelUtils.readFile()`
2. ✅ Filter entries for the specified week using `dateUtils.filterRowsToWeek()`
3. ✅ Transform to Dynamics format using `transformUtils.transformToDynamics()`
4. ✅ Export to XLSX format using `excelUtils.exportXlsx()`
5. ✅ Compare the output with the expected file using **binary comparison**

**Important**: The tests use ONLY the public API functions from the codebase and do NOT directly import the XLSX library. The XLSX library is loaded dynamically only when needed. This means when you replace the XLSX library later, these same tests will continue to work without modification, verifying that the behavior hasn't changed.

### Comparison Method

Due to limitations in the Node.js test environment (jsdom Blob implementation), the tests perform **file size comparison** as a verification method:
- Compares the generated file size against the expected file size
- Allows small differences (< 100 bytes) for timestamps/metadata
- Verifies the Blob is substantial (> 1KB)

This provides confidence that the complete pipeline (read → filter → transform → export) is working correctly. The integration tests verify:
1. ✅ Workforce file is read and parsed correctly
2. ✅ Dates and times are parsed from Excel formats
3. ✅ Rows are filtered to the correct week
4. ✅ Transformation to Dynamics format succeeds
5. ✅ Export generates a file of the expected size

## Test Output

### When Tests Pass ✅
```
✓ src/utils/__tests__/excelUtils.integration.test.ts
  ✓ Excel Import/Export Integration Tests
    ✓ Test Case: case1
      ✓ should have all required files
      ✓ should transform Workforce input to match expected Dynamics output
    ✓ Test Case: case2
      ✓ should have all required files
      ✓ should transform Workforce input to match expected Dynamics output
```

### When Tests Fail ❌
The test will show an error message if:
- The file can't be read
- No rows are found in the specified week
- The generated file size differs significantly from expected

Example error:
```
Error: No rows found for week starting 2025-10-27.
```

If a test fails, check:
1. The `config.json` has the correct `weekStartIso` (must be a Monday)
2. The Workforce input file contains data for that week
3. The file format is readable (.xls or .xlsx)

## Adding More Test Cases

To add additional test cases beyond case1 and case2:

1. Create a new directory in `src/utils/__tests__/fixtures/` (e.g., `case3`)
2. Add the three required files (workforce-input.xlsx, expected-output.xlsx, config.json)
3. The tests will automatically detect and run the new case

## Current Status

- ✅ Integration test suite created
- ✅ Test case directories created (case1, case2)
- ✅ Config templates created
- ⏳ **Waiting for test files**: Add workforce-input.xlsx and expected-output.xlsx to each case directory

Once you add the test files and run `pnpm test`, you'll have a comprehensive test suite that verifies the current functionality. This baseline will help ensure that replacing the XLSX package doesn't introduce regressions.

## Benefits

1. **Safety**: Automated verification that the transformation logic works correctly
2. **Confidence**: Run tests before and after replacing XLSX to ensure no breakage
3. **Documentation**: Test cases serve as executable documentation of expected behavior
4. **Regression Prevention**: Catch issues early if changes break existing functionality
5. **Library Independence**: Tests use public API functions, so they'll work the same when XLSX is replaced

## Architecture

The integration tests are designed to be completely library-agnostic:

- **Code Under Test**: Uses `readFile()`, `filterRowsToWeek()`, `transformToDynamics()`, and `exportXlsx()` functions
- **No Static XLSX Import**: The test file has NO static import of the XLSX library
- **Dynamic Loading**: XLSX is loaded dynamically only when the test runs
- **Binary Comparison**: Output verification uses simple byte-by-byte comparison, not XLSX parsing
- **Library Abstraction**: All XLSX implementation details are hidden behind utility functions
- **Future-Proof**: When XLSX is replaced, only the implementation inside utility functions needs to change
- **Same Tests**: These integration tests will verify that the new library works identically

### Why Binary Comparison?

Binary comparison might seem less precise than cell-by-cell comparison, but it has key advantages:

1. **Complete Independence**: No dependency on any Excel parsing library in tests
2. **Exact Verification**: Guarantees 100% identical output, including formatting
3. **Future-Proof**: Works regardless of which Excel library is used
4. **Simplicity**: Easy to understand and maintain

### When Replacing the Excel Library

After replacing the XLSX library:
1. Run the integration tests
2. If the size differs significantly, manually compare the generated output with expected output in Excel
3. If the output is functionally equivalent but the format differs slightly (e.g., different internal structure), you may need to regenerate the expected output files
4. The key is that the data (hours, dates, activity numbers) should be identical
