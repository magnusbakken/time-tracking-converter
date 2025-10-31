import { describe, it, expect } from 'vitest';
import { calculateHours } from '../timeUtils';

/**
 * Test calculateHours function which works with already-parsed time values.
 * Time parsing is now done in excelUtils.readFile(), so this only tests calculation.
 */
describe('timeUtils', () => {
  describe('calculateHours', () => {
    it('should return 0 for null start time', () => {
      expect(calculateHours(null, 1020)).toBe(0);
    });

    it('should return 0 for null end time', () => {
      expect(calculateHours(540, null)).toBe(0);
    });

    it('should return 0 for both null', () => {
      expect(calculateHours(null, null)).toBe(0);
    });

    it('should calculate hours between two times', () => {
      const hours = calculateHours(540, 1020); // 09:00 to 17:00
      expect(hours).toBe(8);
    });

    it('should calculate hours with partial hours', () => {
      const hours = calculateHours(570, 1065); // 09:30 to 17:45
      expect(hours).toBe(8.25);
    });

    it('should handle overnight shifts', () => {
      const hours = calculateHours(1320, 360); // 22:00 to 06:00
      expect(hours).toBe(8);
    });

    it('should return 0 for same start and end time', () => {
      const hours = calculateHours(540, 540);
      expect(hours).toBe(0);
    });

    it('should handle zero start time (midnight)', () => {
      const hours = calculateHours(0, 480); // 00:00 to 08:00
      expect(hours).toBe(8);
    });

    it('should handle end time just before midnight', () => {
      const hours = calculateHours(540, 1439); // 09:00 to 23:59
      expect(hours).toBe(14.983333333333333);
    });

    it('should correctly handle edge case near midnight', () => {
      const hours = calculateHours(1380, 60); // 23:00 to 01:00 (2 hours overnight)
      expect(hours).toBe(2);
    });
  });
});
