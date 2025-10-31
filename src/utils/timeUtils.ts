/**
 * Calculate hours from start and end time (both in minutes since midnight).
 * Times are already parsed by excelUtils.readFile().
 *
 * @param startMinutes - Start time in minutes since midnight (0-1439), or null
 * @param endMinutes - End time in minutes since midnight (0-1439), or null
 * @returns Hours worked, or 0 if either time is null
 */
export function calculateHours(startMinutes: number | null, endMinutes: number | null): number {
  if (startMinutes === null || endMinutes === null) return 0;

  let diff = endMinutes - startMinutes;
  if (diff < 0) diff += 24 * 60; // Handle overnight shift

  return Math.max(0, diff / 60);
}
