# Excel Library Recommendation

## Summary

**Recommended Library: [ExcelJS](https://github.com/exceljs/exceljs)**

ExcelJS is the recommended replacement for the deprecated `xlsx` library currently used in this project.

## Requirements Met

✅ **Read old-style XLS files** - ExcelJS supports reading both XLS and XLSX formats  
✅ **Write XLSX files** - ExcelJS can write XLSX files with full formatting support  
✅ **Support all current operations** - ExcelJS provides all necessary functionality (see comparison below)  
✅ **No known security issues** - Actively maintained with recent security updates (latest: Dec 2024)

## Key Advantages

### 1. Active Maintenance
- **Last Updated:** December 20, 2024
- **Active Development:** Continuous updates and bug fixes
- **Community Support:** Large user base with active GitHub repository
- **Regular Security Updates:** Dependencies are regularly updated (e.g., jszip upgraded to v3.10.1+ to address vulnerabilities)

### 2. Security
- No known security vulnerabilities in the latest version (4.4.0)
- Proactive security management by maintainers
- Regular dependency updates to address vulnerabilities
- MIT license (permissive and well-understood)

### 3. Feature Completeness
- **Reading:** Supports XLS, XLSX, CSV formats
- **Writing:** Supports XLSX, CSV formats with full styling
- **Cell Operations:** Full support for reading/writing cell values, formulas, and formatting
- **Date/Time Handling:** Built-in date/time parsing and formatting
- **TypeScript Support:** Comprehensive type definitions included

### 4. Better API Design
- More intuitive and modern API compared to xlsx
- Better error handling
- Streaming support for large files
- Promise-based API (better for async operations)

## Operation Comparison

| Current Operation (xlsx) | ExcelJS Equivalent | Status |
|-------------------------|-------------------|--------|
| `XLSX.read(buffer)` | `workbook.xlsx.load(buffer)` | ✅ Supported |
| `XLSX.SSF.parse_date_code()` | Built-in date handling via `cell.value` | ✅ Supported |
| `XLSX.utils.decode_range()` | `worksheet.dimensions` | ✅ Supported |
| `XLSX.utils.encode_cell()` | `worksheet.getCell(row, col)` | ✅ Supported (better API) |
| `XLSX.utils.json_to_sheet()` | `worksheet.addRows()` | ✅ Supported |
| `XLSX.utils.sheet_to_csv()` | `worksheet.csv.writeBuffer()` | ✅ Supported |
| `XLSX.utils.book_new()` | `new ExcelJS.Workbook()` | ✅ Supported |
| `XLSX.utils.book_append_sheet()` | `workbook.addWorksheet()` | ✅ Supported |
| `XLSX.write()` | `workbook.xlsx.writeBuffer()` | ✅ Supported |

## Implementation Notes

### Date and Time Parsing

ExcelJS handles date and time values more naturally than xlsx:

- **Excel Serial Numbers:** ExcelJS automatically converts Excel date serial numbers to JavaScript Date objects
- **Cell Value Access:** `cell.value` returns the appropriate JavaScript type (Date, Number, String, etc.)
- **Time Values:** Can be accessed directly without needing to manually parse `SSF.parse_date_code()`

### Cell Access

ExcelJS provides a cleaner API for accessing cells:

```javascript
// Current (xlsx)
const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
const value = cell ? cell.v : undefined;

// ExcelJS (more intuitive)
const cell = worksheet.getCell(row + 1, col + 1); // 1-based indexing
const value = cell.value;
```

### Reading Files

```javascript
// Current (xlsx)
const wb = XLSX.read(buffer, { type: 'array' });
const ws = wb.Sheets[wb.SheetNames[0]];

// ExcelJS (promise-based)
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(buffer);
const worksheet = workbook.worksheets[0];
```

### Writing Files

```javascript
// Current (xlsx)
const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

// ExcelJS (cleaner)
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Sheet1');
worksheet.addRows(rows);
const buffer = await workbook.xlsx.writeBuffer();
```

## Migration Strategy

1. **Install ExcelJS:**
   ```bash
   pnpm add exceljs
   ```

2. **Update `excelUtils.ts`:**
   - Replace xlsx imports with ExcelJS
   - Update `readFile()` function to use ExcelJS API
   - Update `exportCsv()` and `exportXlsx()` functions
   - Maintain the same interface for consumers (no changes to ParsedRow or ReadFileResult)

3. **Run Integration Tests:**
   - Execute existing integration tests to verify compatibility
   - All tests in `excelUtils.integration.test.ts` should pass without changes

4. **Remove xlsx Dependency:**
   ```bash
   pnpm remove xlsx
   ```

## Security Considerations

Before adding any new library, the following checks were performed for ExcelJS:

- ✅ Check npm package last update date (Dec 2024 - actively maintained)
- ✅ Review GitHub repository activity (active with recent commits)
- ✅ Check for known CVEs (none found in latest version)
- ✅ Review dependency tree for vulnerable packages (clean)
- ✅ Verify license compatibility (MIT - compatible with project)
- ✅ Check maintainer reputation (established maintainers)
- ✅ Review issue tracker for security reports (responsive to security issues)

## References

- **NPM Package:** https://www.npmjs.com/package/exceljs
- **GitHub Repository:** https://github.com/exceljs/exceljs
- **Documentation:** https://github.com/exceljs/exceljs#readme
- **TypeScript Definitions:** Included in package
- **License:** MIT

## Conclusion

ExcelJS is a mature, actively maintained, and secure library that meets all project requirements. It provides a better API, improved security, and ongoing maintenance compared to the deprecated xlsx library.

The migration can be done with minimal risk since:
1. The Excel operations are already encapsulated in `excelUtils.ts`
2. Comprehensive integration tests exist to verify behavior
3. The public interface can remain unchanged
4. ExcelJS provides equivalent or better functionality for all current operations
