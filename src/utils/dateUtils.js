import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

/**
 * Parse a date cell value from Excel or string format
 * Handles Excel serial numbers, Norwegian DD.MM.YY format, and generic parse
 */
export function parseDateCell(value, XLSX) {
  // Handle Excel serial number
  if (typeof value === 'number') {
    const jsDate = XLSX.SSF.parse_date_code(value)
    if (!jsDate) return null
    const d = dayjs(new Date(jsDate.y, jsDate.m - 1, jsDate.d))
    return d.isValid() ? d : null
  }
  
  // Handle Norwegian DD.MM.YY or DD.MM.YYYY format
  if (typeof value === 'string') {
    const s = value.trim()
    const m = s.match(/^\s*(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})\s*$/)
    if (m) {
      const day = parseInt(m[1], 10)
      const month = parseInt(m[2], 10)
      let year = parseInt(m[3], 10)
      if (m[3].length === 2) year = 2000 + year // Assume 2000-2099 for two-digit year

      // Validate explicit day/month ranges to avoid Date rollover
      if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
      if (month < 1 || month > 12) return null
      if (day < 1) return null
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
      const monthLengths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
      const maxDay = monthLengths[month - 1]
      if (day > maxDay) return null

      const d = dayjs(new Date(year, month - 1, day))
      return d.isValid() ? d : null
    }
  }
  
  // Fallback to generic parse
  const d = dayjs(value)
  return d.isValid() ? d : null
}

/**
 * Set week start to Monday from any given date
 */
export function setWeekStartFromDate(date) {
  const d = dayjs(date)
  if (!d.isValid()) return null
  const monday = d.isoWeekday() === 1 ? d : d.isoWeekday(1)
  return monday.format('YYYY-MM-DD')
}

/**
 * Get week info (week number and year) from a date
 */
export function getWeekInfo(dateStr) {
  if (!dateStr) return null
  const d = dayjs(dateStr)
  if (!d.isValid()) return null
  return {
    weekNum: d.isoWeek(),
    year: d.isoWeekYear(),
  }
}

/**
 * Get current week's Monday
 */
export function getCurrentWeekMonday() {
  const today = dayjs()
  const monday = today.isoWeekday() === 1 ? today : today.isoWeekday(1)
  return monday.format('YYYY-MM-DD')
}

/**
 * Check if a date falls within a week starting from weekStartIso
 */
export function isDateInWeek(date, weekStartIso) {
  const weekStart = dayjs(weekStartIso)
  const weekEnd = weekStart.add(7, 'day')
  return date.isSame(weekStart) || (date.isAfter(weekStart) && date.isBefore(weekEnd))
}

/**
 * Filter rows to only include those within the specified week
 */
export function filterRowsToWeek(rows, weekStartIso, XLSX) {
  if (!weekStartIso) return []
  const start = dayjs(weekStartIso)
  const end = start.add(7, 'day')
  
  return rows
    .map(r => {
      const d = parseDateCell(r.date, XLSX)
      return d ? { row: r, date: d } : null
    })
    .filter(Boolean)
    .filter(({ date }) => date.isSame(start) || (date.isAfter(start) && date.isBefore(end)))
}

/**
 * Check if the current week exists in the uploaded file
 * Returns { hasCurrentWeek: boolean, warningMessage: string | null }
 */
export function checkCurrentWeekInFile(rawRows, XLSX) {
  const currentMonday = getCurrentWeekMonday()
  const dates = rawRows.map(r => parseDateCell(r.date, XLSX)).filter(Boolean)
  
  if (!dates.length) {
    return { hasCurrentWeek: false, warningMessage: null }
  }
  
  const weekStart = dayjs(currentMonday)
  const weekEnd = weekStart.add(7, 'day')
  const hasCurrentWeek = dates.some(date => 
    date.isSame(weekStart) || (date.isAfter(weekStart) && date.isBefore(weekEnd))
  )
  
  if (hasCurrentWeek) {
    return { hasCurrentWeek: true, warningMessage: null }
  }
  
  const weekInfo = getWeekInfo(currentMonday)
  const warningMessage = `⚠️ Warning: The current week (${weekInfo.year}-W${String(weekInfo.weekNum).padStart(2, '0')}) is not present in the uploaded file. You may have chosen the wrong file.`
  
  return { hasCurrentWeek: false, warningMessage }
}
