import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import type { ParsedRow } from './excelUtils';

dayjs.extend(isoWeek);

export interface WeekInfo {
  weekNum: number;
  year: number;
}

export interface CheckCurrentWeekResult {
  hasCurrentWeek: boolean;
  warningMessage: string | null;
}

export interface FilteredRow {
  row: ParsedRow;
  date: Dayjs;
}

/**
 * Set week start to Monday from any given date
 */
export function setWeekStartFromDate(date: string): string | null {
  const d = dayjs(date);
  if (!d.isValid()) return null;
  const monday = d.isoWeekday() === 1 ? d : d.isoWeekday(1);
  return monday.format('YYYY-MM-DD');
}

/**
 * Get week info (week number and year) from a date
 */
export function getWeekInfo(dateStr: string | null): WeekInfo | null {
  if (!dateStr) return null;
  const d = dayjs(dateStr);
  if (!d.isValid()) return null;
  return {
    weekNum: d.isoWeek(),
    year: d.isoWeekYear(),
  };
}

/**
 * Get current week's Monday
 */
export function getCurrentWeekMonday(): string {
  const today = dayjs();
  const monday = today.isoWeekday() === 1 ? today : today.isoWeekday(1);
  return monday.format('YYYY-MM-DD');
}

/**
 * Check if a date falls within a week starting from weekStartIso
 */
export function isDateInWeek(date: Dayjs, weekStartIso: string): boolean {
  const weekStart = dayjs(weekStartIso);
  const weekEnd = weekStart.add(7, 'day');
  return date.isSame(weekStart) || (date.isAfter(weekStart) && date.isBefore(weekEnd));
}

/**
 * Filter rows to only include those within the specified week.
 * Rows with null dates are excluded.
 */
export function filterRowsToWeek(rows: ParsedRow[], weekStartIso: string): FilteredRow[] {
  if (!weekStartIso) return [];
  const start = dayjs(weekStartIso);
  const end = start.add(7, 'day');

  return rows
    .map((r) => {
      if (!r.date) return null;
      const d = dayjs(r.date);
      return d.isValid() ? { row: r, date: d } : null;
    })
    .filter((item): item is FilteredRow => item !== null)
    .filter(({ date }) => date.isSame(start) || (date.isAfter(start) && date.isBefore(end)));
}

/**
 * Get all valid dates from parsed rows
 */
export function getValidDates(rows: ParsedRow[]): Dayjs[] {
  return rows
    .map((r) => (r.date ? dayjs(r.date) : null))
    .filter((d): d is Dayjs => d?.isValid() ?? false);
}

/**
 * Check if the current week exists in the uploaded file.
 * Returns { hasCurrentWeek: boolean, warningMessage: string | null }
 */
export function checkCurrentWeekInFile(rows: ParsedRow[]): CheckCurrentWeekResult {
  const currentMonday = getCurrentWeekMonday();
  const dates = getValidDates(rows);

  if (!dates.length) {
    return { hasCurrentWeek: false, warningMessage: null };
  }

  const weekStart = dayjs(currentMonday);
  const weekEnd = weekStart.add(7, 'day');
  const hasCurrentWeek = dates.some(
    (date) => date.isSame(weekStart) || (date.isAfter(weekStart) && date.isBefore(weekEnd))
  );

  if (hasCurrentWeek) {
    return { hasCurrentWeek: true, warningMessage: null };
  }

  const weekInfo = getWeekInfo(currentMonday);
  const warningMessage = `⚠️ Warning: The current week (${weekInfo?.year}-W${String(weekInfo?.weekNum).padStart(2, '0')}) is not present in the uploaded file. You may have chosen the wrong file.`;

  return { hasCurrentWeek: false, warningMessage };
}
