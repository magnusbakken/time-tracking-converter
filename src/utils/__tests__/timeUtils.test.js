import { describe, it, expect } from 'vitest'
import { parseTimeToMinutes, parseHoursFromTimes } from '../timeUtils'

// Mock XLSX for testing
const mockXLSX = {
  SSF: {
    parse_date_code: (value) => {
      // Simulate Excel time serial (0.5 = 12:00, 0.375 = 09:00, etc.)
      if (value >= 0 && value <= 1) {
        const totalMinutes = Math.round(value * 1440)
        return {
          H: Math.floor(totalMinutes / 60),
          M: totalMinutes % 60,
        }
      }
      return null
    },
  },
}

describe('timeUtils', () => {
  describe('parseTimeToMinutes', () => {
    it('should return null for empty values', () => {
      expect(parseTimeToMinutes(null, mockXLSX)).toBeNull()
      expect(parseTimeToMinutes(undefined, mockXLSX)).toBeNull()
      expect(parseTimeToMinutes('', mockXLSX)).toBeNull()
    })

    it('should parse HH:MM format', () => {
      expect(parseTimeToMinutes('09:00', mockXLSX)).toBe(540)
      expect(parseTimeToMinutes('17:30', mockXLSX)).toBe(1050)
      expect(parseTimeToMinutes('00:00', mockXLSX)).toBe(0)
      expect(parseTimeToMinutes('23:59', mockXLSX)).toBe(1439)
    })

    it('should parse HH.MM format', () => {
      expect(parseTimeToMinutes('09.00', mockXLSX)).toBe(540)
      expect(parseTimeToMinutes('17.30', mockXLSX)).toBe(1050)
    })

    it('should parse HH format (no minutes)', () => {
      expect(parseTimeToMinutes('9', mockXLSX)).toBe(540)
      expect(parseTimeToMinutes('17', mockXLSX)).toBe(1020)
    })

    it('should handle comma as decimal separator', () => {
      expect(parseTimeToMinutes('09,00', mockXLSX)).toBe(540)
      expect(parseTimeToMinutes('17,30', mockXLSX)).toBe(1050)
    })

    it('should parse Excel serial number format', () => {
      expect(parseTimeToMinutes(0.375, mockXLSX)).toBe(540) // 09:00
      expect(parseTimeToMinutes(0.5, mockXLSX)).toBe(720) // 12:00
    })

    it('should return null for invalid times', () => {
      expect(parseTimeToMinutes('25:00', mockXLSX)).toBeNull() // Invalid hour
      expect(parseTimeToMinutes('12:60', mockXLSX)).toBeNull() // Invalid minute
      expect(parseTimeToMinutes('abc', mockXLSX)).toBeNull() // Invalid format
    })
  })

  describe('parseHoursFromTimes', () => {
    it('should calculate hours between two times', () => {
      const hours = parseHoursFromTimes('09:00', '17:00', mockXLSX)
      expect(hours).toBe(8)
    })

    it('should calculate hours with minutes', () => {
      const hours = parseHoursFromTimes('09:30', '17:45', mockXLSX)
      expect(hours).toBe(8.25)
    })

    it('should handle overnight shifts', () => {
      const hours = parseHoursFromTimes('22:00', '06:00', mockXLSX)
      expect(hours).toBe(8)
    })

    it('should return 0 for invalid start time', () => {
      const hours = parseHoursFromTimes(null, '17:00', mockXLSX)
      expect(hours).toBe(0)
    })

    it('should return 0 for invalid end time', () => {
      const hours = parseHoursFromTimes('09:00', null, mockXLSX)
      expect(hours).toBe(0)
    })

    it('should return 0 for same start and end time', () => {
      const hours = parseHoursFromTimes('09:00', '09:00', mockXLSX)
      expect(hours).toBe(0)
    })
  })
})
