/**
 * Parse time value to minutes
 * Handles Excel serial numbers, HH:MM, HH.MM formats
 */
export function parseTimeToMinutes(value, XLSX) {
  if (value === null || value === undefined || value === '') return null
  
  // Handle Excel serial number
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed && Number.isFinite(parsed.H) && Number.isFinite(parsed.M)) {
      return parsed.H * 60 + parsed.M
    }
    if (value >= 0 && value <= 1) {
      return Math.round(value * 1440)
    }
    return null
  }
  
  // Handle string formats
  const raw = String(value).trim()
  if (!raw) return null
  const normalized = raw.replace(',', '.')
  
  // Match HH.MM or HH:MM
  let m = normalized.match(/^\s*(\d{1,2})[\.:](\d{2})\s*$/)
  let hours, minutes
  if (m) {
    hours = parseInt(m[1], 10)
    minutes = parseInt(m[2], 10)
  } else {
    // Fallback: just HH
    m = normalized.match(/^\s*(\d{1,2})\s*$/)
    if (!m) return null
    hours = parseInt(m[1], 10)
    minutes = 0
  }
  
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  if (hours < 0 || hours > 23) return null
  if (minutes < 0 || minutes > 59) return null
  
  return hours * 60 + minutes
}

/**
 * Calculate hours from start and end time strings
 */
export function parseHoursFromTimes(startStr, endStr, XLSX) {
  const startMin = parseTimeToMinutes(startStr, XLSX)
  const endMin = parseTimeToMinutes(endStr, XLSX)
  
  if (startMin === null || endMin === null) return 0
  
  let diff = endMin - startMin
  if (diff < 0) diff += 24 * 60 // overnight shift
  
  return Math.max(0, diff / 60)
}
