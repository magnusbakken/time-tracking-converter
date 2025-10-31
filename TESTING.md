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

1. ✅ Read the Workforce input file
2. ✅ Extract time entry rows (from columns I, N, T starting at row 13)
3. ✅ Filter entries for the specified week
4. ✅ Transform to Dynamics format (work hours + lunch)
5. ✅ Export to XLSX format
6. ✅ Compare the output with the expected file

The test compares:
- Number of rows
- All column values (LineNum, ProjectDataAreaId, ProjId, ACTIVITYNUMBER)
- Hours for each day of the week (HOURS, Hours2_, Hours3_, etc.)
- Comments for each day (EXTERNALCOMMENTS, ExternalComments2_, etc.)

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
The test will show detailed differences:
```
Differences found:
  - Row 1, Column "HOURS": expected "8", got "7.5"
  - Row 1, Column "Hours2_": expected "8", got "8.5"
```

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
