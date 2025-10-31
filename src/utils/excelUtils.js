import * as XLSX from 'xlsx'

/**
 * Read Excel/CSV file and extract time entry rows
 * Fixed columns: I (8), N (13), T (19). Data starts at row 13 (index 12).
 */
export async function readFile(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = wb.SheetNames[0]
  const ws = wb.Sheets[firstSheetName]

  // Fixed columns: I (8), N (13), T (19). Data starts at row 13 (index 12).
  const ref = ws['!ref'] || 'A1:A1'
  const range = XLSX.utils.decode_range(ref)
  const startRow = Math.max(12, range.s.r) // 0-based index for row 13
  const COL_I = 8  // Arbeidsdato (Date)
  const COL_N = 13 // Inntid (Start time)
  const COL_T = 19 // Ut-tid (End time)
  
  const rows = []
  for (let r = startRow; r <= range.e.r; r++) {
    const dCell = ws[XLSX.utils.encode_cell({ r, c: COL_I })]
    const sCell = ws[XLSX.utils.encode_cell({ r, c: COL_N })]
    const eCell = ws[XLSX.utils.encode_cell({ r, c: COL_T })]
    
    const dVal = dCell ? dCell.v : ''
    const sVal = sCell ? sCell.v : ''
    const eVal = eCell ? eCell.v : ''
    
    const isAllEmpty = (dVal === '' || dVal === null || dVal === undefined)
      && (sVal === '' || sVal === null || sVal === undefined)
      && (eVal === '' || eVal === null || eVal === undefined)
    
    if (isAllEmpty) continue // Skip empty rows but do not stop scanning
    
    rows.push({ date: dVal, startTime: sVal, endTime: eVal })
  }

  return {
    workbook: wb,
    rawRows: rows,
    fileName: file.name,
    sheetName: firstSheetName,
  }
}

/**
 * Export rows to CSV
 */
export function exportCsv(rows, headers) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers })
  const csv = XLSX.utils.sheet_to_csv(ws)
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

/**
 * Export rows to XLSX
 */
export function exportXlsx(rows, headers) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Import')
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([out], { type: 'application/octet-stream' })
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
