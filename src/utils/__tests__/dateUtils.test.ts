import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  setWeekStartFromDate,
  getWeekInfo,
  getCurrentWeekMonday,
  isDateInWeek,
} from '../dateUtils';

dayjs.extend(isoWeek);

describe('dateUtils', () => {
  describe('setWeekStartFromDate', () => {
    it('should return Monday for a Monday date', () => {
      const result = setWeekStartFromDate('2025-10-27'); // Monday
      expect(result).toBe('2025-10-27');
    });

    it('should return Monday for a Wednesday date', () => {
      const result = setWeekStartFromDate('2025-10-29'); // Wednesday
      expect(result).toBe('2025-10-27'); // Previous Monday
    });

    it('should return Monday for a Sunday date', () => {
      const result = setWeekStartFromDate('2025-11-02'); // Sunday
      expect(result).toBe('2025-10-27'); // Previous Monday
    });

    it('should return null for invalid date', () => {
      const result = setWeekStartFromDate('invalid-date');
      expect(result).toBeNull();
    });
  });

  describe('getWeekInfo', () => {
    it('should return correct week number and year', () => {
      const result = getWeekInfo('2025-10-27');
      expect(result).toEqual({ weekNum: 44, year: 2025 });
    });

    it('should return null for invalid date', () => {
      const result = getWeekInfo('invalid-date');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = getWeekInfo('');
      expect(result).toBeNull();
    });
  });

  describe('getCurrentWeekMonday', () => {
    it('should return a valid Monday date in YYYY-MM-DD format', () => {
      const result = getCurrentWeekMonday();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const date = dayjs(result);
      expect(date.isValid()).toBe(true);
      expect(date.isoWeekday()).toBe(1); // Monday
    });
  });

  describe('isDateInWeek', () => {
    it('should return true for date at start of week', () => {
      const date = dayjs('2025-10-27'); // Monday
      const result = isDateInWeek(date, '2025-10-27');
      expect(result).toBe(true);
    });

    it('should return true for date in middle of week', () => {
      const date = dayjs('2025-10-29'); // Wednesday
      const result = isDateInWeek(date, '2025-10-27');
      expect(result).toBe(true);
    });

    it('should return false for date in next week', () => {
      const date = dayjs('2025-11-03'); // Next Monday
      const result = isDateInWeek(date, '2025-10-27');
      expect(result).toBe(false);
    });

    it('should return false for date in previous week', () => {
      const date = dayjs('2025-10-26'); // Previous Sunday
      const result = isDateInWeek(date, '2025-10-27');
      expect(result).toBe(false);
    });
  });
});
