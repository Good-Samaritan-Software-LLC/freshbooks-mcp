/**
 * Date utilities for working around SDK date-transform quirks.
 */

/**
 * Convert a date-only value to a Date at LOCAL midnight.
 *
 * The FreshBooks SDK's `transformDateRequest` parses a `"YYYY-MM-DD"` string as
 * UTC midnight and then reads its LOCAL year/month/day. In timezones behind UTC
 * (e.g. the Americas) that lands on the previous day, so a user-entered date is
 * silently stored one day early (#76).
 *
 * Passing a Date that is already at LOCAL midnight makes that transform read the
 * intended calendar date in any timezone (it skips its `new Date(string)` branch
 * and the local getters return the right Y/M/D).
 *
 * - `"YYYY-MM-DD"` (optionally with a trailing time/zone) → Date at local midnight
 *   of that calendar day.
 * - an existing `Date` → returned unchanged (single() responses already come back
 *   as local-midnight Dates).
 * - `null` / `undefined` / a string that isn't a leading `YYYY-MM-DD` → returned
 *   unchanged (let the SDK handle it).
 */
export function toLocalMidnightDate(
  value: string | Date | null | undefined
): string | Date | null | undefined {
  if (value == null || value instanceof Date) {
    return value;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Whole calendar days from `start` to `end` (`YYYY-MM-DD` strings, or Dates as
 * returned by SDK responses). Negative if end precedes start; 0 if either is
 * unparseable. Used to derive bill/invoice `due_offset_days` from dates.
 */
export function daysBetween(start: string | Date, end: string | Date): number {
  const a = toLocalMidnightDate(start);
  const b = toLocalMidnightDate(end);
  if (!(a instanceof Date) || !(b instanceof Date)) {
    return 0;
  }
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
