import dayjs from 'dayjs';
import { calculateHours } from './timeUtils';
import type { FilteredRow } from './dateUtils';

// Dynamics column definitions and explicit header order
const HOURS_COLS = [
  'HOURS',
  'Hours2_',
  'Hours3_',
  'Hours4_',
  'Hours5_',
  'Hours6_',
  'Hours7_',
] as const;
const COMMENT_COLS = [
  'EXTERNALCOMMENTS',
  'ExternalComments2_',
  'ExternalComments3_',
  'ExternalComments4_',
  'ExternalComments5_',
  'ExternalComments6_',
  'ExternalComments7_',
] as const;

export const DYNAMICS_HEADERS = [
  'LineNum',
  'ProjectDataAreaId',
  'ProjId',
  'ACTIVITYNUMBER',
  ...HOURS_COLS,
  ...COMMENT_COLS,
] as const;

export { HOURS_COLS, COMMENT_COLS };

type DynamicsRow = {
  LineNum: string;
  ProjectDataAreaId: string;
  ProjId: string;
  ACTIVITYNUMBER: string;
} & Record<(typeof HOURS_COLS)[number], number | ''> &
  Record<(typeof COMMENT_COLS)[number], string>;

/**
 * Transform filtered rows to Dynamics format.
 * Creates two rows: one for work hours and one for lunch.
 * All date/time parsing has already been done by excelUtils.
 */
export function transformToDynamics(rows: FilteredRow[], weekStartIso: string): DynamicsRow[] {
  // Build Dynamics weekly format with two rows: work and lunch
  const weekStart = dayjs(weekStartIso);
  const totalsByDay = new Array(7).fill(0) as number[];

  for (const { row, date } of rows) {
    // Determine index 0..6 where 0 is Monday (weekStart)
    const dayIndex = Math.max(0, Math.min(6, date.diff(weekStart, 'day')));

    const hours = calculateHours(row.startTimeMinutes, row.endTimeMinutes);
    if (Number.isFinite(hours) && hours > 0) {
      totalsByDay[dayIndex] += hours;
    }
  }

  // Normalize to up to 2 decimals
  const normalize = (n: number): number => Number(n.toFixed(2));
  for (let i = 0; i < 7; i++) {
    totalsByDay[i] = totalsByDay[i] > 0 ? normalize(totalsByDay[i]) : 0;
  }

  const BASE_META = {
    ProjectDataAreaId: '110',
    ProjId: '11011127',
  };

  // Row 1: Work time
  const row1: DynamicsRow = {
    LineNum: '1.0000000000000000',
    ...BASE_META,
    ACTIVITYNUMBER: 'A110015929',
  } as DynamicsRow;

  // Initialize day columns with grouped order (all HOURS, then COMMENTS)
  for (let i = 0; i < 7; i++) {
    row1[HOURS_COLS[i]] = '';
  }
  for (let i = 0; i < 7; i++) {
    row1[COMMENT_COLS[i]] = '';
  }
  for (let i = 0; i < 7; i++) {
    if (totalsByDay[i] > 0) {
      row1[HOURS_COLS[i]] = normalize(totalsByDay[i]);
      row1[COMMENT_COLS[i]] = 'Development';
    }
  }

  // Row 2: Lunch 0.5 if any work that day
  const row2: DynamicsRow = {
    LineNum: '2.0000000000000000',
    ...BASE_META,
    ACTIVITYNUMBER: 'A110015932',
  } as DynamicsRow;
  for (let i = 0; i < 7; i++) {
    row2[HOURS_COLS[i]] = '';
  }
  for (let i = 0; i < 7; i++) {
    row2[COMMENT_COLS[i]] = '';
  }
  for (let i = 0; i < 7; i++) {
    if (totalsByDay[i] > 0) {
      row2[HOURS_COLS[i]] = 0.5;
      row2[COMMENT_COLS[i]] = 'Lunsj';
    }
  }

  return [row1, row2];
}
