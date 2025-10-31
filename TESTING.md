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

The tests perform a **byte-by-byte binary comparison** of the generated output file against the expected output file. This ensures:
- Complete file identity verification
- No dependency on parsing the XLSX format in tests
- Tests remain valid when the Excel library is replaced

If files don't match, the test will report:
- File size difference (if sizes differ)
- Content difference (if bytes differ)

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
The test will show a comparison message:
```
File size mismatch: expected 8192 bytes, got 8256 bytes
```
or
```
Files differ in content
```

If the test fails, you can manually inspect the expected and actual files to determine what changed.

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

If a test fails after replacing the XLSX library, you can:
- Manually open both files in Excel to compare
- Use a diff tool to see what changed
- Regenerate the expected output if the new library produces equivalent but slightly different output
