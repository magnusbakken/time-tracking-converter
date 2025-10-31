import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { transformToDynamics, DYNAMICS_HEADERS, HOURS_COLS, COMMENT_COLS } from '../transformUtils';
import type { ParsedRow } from '../excelUtils';

/**
 * Test transformToDynamics with already-parsed data.
 * Date/time parsing is now done in excelUtils.readFile().
 */
describe('transformUtils', () => {
  describe('transformToDynamics', () => {
    it('should create two rows (work and lunch)', () => {
      const parsedRow: ParsedRow = {
        date: new Date('2025-10-27'),
        startTimeMinutes: 540, // 09:00
        endTimeMinutes: 1020, // 17:00
      };
      const rows = [
        {
          row: parsedRow,
          date: dayjs('2025-10-27'),
        },
      ];
      const result = transformToDynamics(rows, '2025-10-27');

      expect(result).toHaveLength(2);
      expect(result[0].ACTIVITYNUMBER).toBe('A110015929'); // Work
      expect(result[1].ACTIVITYNUMBER).toBe('A110015932'); // Lunch
    });

    it('should calculate correct hours for Monday', () => {
      const parsedRow: ParsedRow = {
        date: new Date('2025-10-27'),
        startTimeMinutes: 540, // 09:00
        endTimeMinutes: 1020, // 17:00
      };
      const rows = [
        {
          row: parsedRow,
          date: dayjs('2025-10-27'),
        },
      ];
      const result = transformToDynamics(rows, '2025-10-27');

      expect(result[0][HOURS_COLS[0]]).toBe(8); // Monday work hours
      expect(result[1][HOURS_COLS[0]]).toBe(0.5); // Monday lunch hours
    });

    it('should handle multiple days in a week', () => {
      const rows = [
        {
          row: {
            date: new Date('2025-10-27'),
            startTimeMinutes: 540,
            endTimeMinutes: 1020,
          } as ParsedRow,
          date: dayjs('2025-10-27'),
        },
        {
          row: {
            date: new Date('2025-10-28'),
            startTimeMinutes: 540,
            endTimeMinutes: 1020,
          } as ParsedRow,
          date: dayjs('2025-10-28'),
        },
        {
          row: {
            date: new Date('2025-10-29'),
            startTimeMinutes: 540,
            endTimeMinutes: 780, // 13:00
          } as ParsedRow,
          date: dayjs('2025-10-29'),
        },
      ];
      const result = transformToDynamics(rows, '2025-10-27');

      expect(result[0][HOURS_COLS[0]]).toBe(8); // Monday
      expect(result[0][HOURS_COLS[1]]).toBe(8); // Tuesday
      expect(result[0][HOURS_COLS[2]]).toBe(4); // Wednesday
      expect(result[0][HOURS_COLS[3]]).toBe(''); // Thursday (empty)
    });

    it('should add comments for work days', () => {
      const parsedRow: ParsedRow = {
        date: new Date('2025-10-27'),
        startTimeMinutes: 540,
        endTimeMinutes: 1020,
      };
      const rows = [
        {
          row: parsedRow,
          date: dayjs('2025-10-27'),
        },
      ];
      const result = transformToDynamics(rows, '2025-10-27');

      expect(result[0][COMMENT_COLS[0]]).toBe('Development');
      expect(result[1][COMMENT_COLS[0]]).toBe('Lunsj');
    });

    it('should not add lunch for days with no work', () => {
      const parsedRow: ParsedRow = {
        date: new Date('2025-10-27'),
        startTimeMinutes: 540,
        endTimeMinutes: 1020,
      };
      const rows = [
        {
          row: parsedRow,
          date: dayjs('2025-10-27'),
        },
      ];
      const result = transformToDynamics(rows, '2025-10-27');

      expect(result[0][HOURS_COLS[1]]).toBe(''); // Tuesday - no work
      expect(result[1][HOURS_COLS[1]]).toBe(''); // Tuesday - no lunch
    });

    it('should include all required Dynamics headers', () => {
      const parsedRow: ParsedRow = {
        date: new Date('2025-10-27'),
        startTimeMinutes: 540,
        endTimeMinutes: 1020,
      };
      const rows = [
        {
          row: parsedRow,
          date: dayjs('2025-10-27'),
        },
      ];
      const result = transformToDynamics(rows, '2025-10-27');

      expect(result[0].LineNum).toBe('1.0000000000000000');
      expect(result[0].ProjectDataAreaId).toBe('110');
      expect(result[0].ProjId).toBe('11011127');

      expect(result[1].LineNum).toBe('2.0000000000000000');
      expect(result[1].ProjectDataAreaId).toBe('110');
      expect(result[1].ProjId).toBe('11011127');
    });

    it('should handle decimal hours correctly', () => {
      const parsedRow: ParsedRow = {
        date: new Date('2025-10-27'),
        startTimeMinutes: 540, // 09:00
        endTimeMinutes: 750, // 12:30
      };
      const rows = [
        {
          row: parsedRow,
          date: dayjs('2025-10-27'),
        },
      ];
      const result = transformToDynamics(rows, '2025-10-27');

      expect(result[0][HOURS_COLS[0]]).toBe(3.5);
    });
  });

  describe('DYNAMICS_HEADERS', () => {
    it('should have correct header order', () => {
      expect(DYNAMICS_HEADERS[0]).toBe('LineNum');
      expect(DYNAMICS_HEADERS[1]).toBe('ProjectDataAreaId');
      expect(DYNAMICS_HEADERS[2]).toBe('ProjId');
      expect(DYNAMICS_HEADERS[3]).toBe('ACTIVITYNUMBER');
      expect(DYNAMICS_HEADERS[4]).toBe('HOURS');
      expect(DYNAMICS_HEADERS[11]).toBe('EXTERNALCOMMENTS');
    });

    it('should have all 7 day columns for hours and comments', () => {
      expect(HOURS_COLS).toHaveLength(7);
      expect(COMMENT_COLS).toHaveLength(7);
    });
  });
});
