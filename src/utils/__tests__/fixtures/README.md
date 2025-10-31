# Test Fixtures

This directory contains test files for integration testing of the Excel import/export functionality.

## Directory Structure

Place your test files in the following structure:

```
fixtures/
├── case1/
│   ├── workforce-input.xlsx     (or .xls)
│   ├── expected-output.xlsx
│   └── config.json              (contains week start date and other test params)
├── case2/
│   ├── workforce-input.xlsx
│   ├── expected-output.xlsx
│   └── config.json
└── README.md
```

## Config File Format

Each `config.json` file should contain:

```json
{
  "weekStartIso": "2025-10-27",
  "description": "Optional description of this test case"
}
```

- `weekStartIso`: The Monday of the week to use for the transformation (ISO 8601 format: YYYY-MM-DD)
- `description`: Optional human-readable description of what this test case covers

## Test Files

- **workforce-input.xlsx**: The input Workforce timesheet file  
  **⚠️ Important**: Use `.xlsx` format (not `.xls`). The old `.xls` format is not fully supported by the xlsx library without additional dependencies.
- **expected-output.xlsx**: The expected Dynamics output file after transformation
- **config.json**: Configuration for the test case (week start date, etc.)

### File Format Notes

The integration tests work with `.xlsx` files (Office Open XML format). If you have `.xls` files (older Excel format):
1. Open the file in Excel or LibreOffice
2. Save As → Choose "Excel Workbook (.xlsx)" format
3. Use the converted `.xlsx` file for testing

## Adding New Test Cases

1. Create a new directory (e.g., `case3/`)
2. Add the three required files
3. The integration tests will automatically detect and run all test cases
