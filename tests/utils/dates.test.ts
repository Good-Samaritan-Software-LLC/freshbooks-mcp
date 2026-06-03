/**
 * Tests for toLocalMidnightDate (the #76 date-shift guard).
 */
import { describe, it, expect } from 'vitest';
import { toLocalMidnightDate, daysBetween } from '../../src/utils/dates.js';

/**
 * Reproduce what the SDK's transformDateRequest does to a value: if it's a
 * string it parses with `new Date(...)`, then reads LOCAL components. This is the
 * exact code path that shifts a "YYYY-MM-DD" string back a day in negative-UTC
 * zones. We assert our helper's output survives it unchanged.
 */
function sdkFormat(value: string | Date | null | undefined): string {
  const d = typeof value === 'string' ? new Date(value) : (value as Date);
  const year = d.getFullYear();
  const month = d.toLocaleDateString(undefined, { month: '2-digit' });
  const day = d.toLocaleDateString(undefined, { day: '2-digit' });
  return `${year}-${month}-${day}`;
}

describe('toLocalMidnightDate', () => {
  it('converts a YYYY-MM-DD string to a local-midnight Date', () => {
    const d = toLocalMidnightDate('2026-06-02') as Date;
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // June (0-indexed)
    expect(d.getDate()).toBe(2);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('survives the SDK date transform without shifting (the #76 fix)', () => {
    // A raw string shifts under the SDK transform in negative-UTC zones; the
    // helper output must round-trip to the SAME calendar date in ANY zone.
    for (const input of ['2026-06-02', '2024-01-01', '2024-12-31', '2024-02-29']) {
      expect(sdkFormat(toLocalMidnightDate(input))).toBe(input);
    }
  });

  it('extracts the date portion from a full ISO datetime', () => {
    const d = toLocalMidnightDate('2026-06-02T09:30:00Z') as Date;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(2);
  });

  it('passes an existing Date through unchanged', () => {
    const existing = new Date(2026, 5, 2);
    expect(toLocalMidnightDate(existing)).toBe(existing);
  });

  it('passes null and undefined through unchanged', () => {
    expect(toLocalMidnightDate(null)).toBeNull();
    expect(toLocalMidnightDate(undefined)).toBeUndefined();
  });

  it('passes a non-date string through unchanged (lets the SDK handle it)', () => {
    expect(toLocalMidnightDate('not-a-date')).toBe('not-a-date');
    expect(toLocalMidnightDate('')).toBe('');
  });
});

describe('daysBetween', () => {
  it('counts whole calendar days between two YYYY-MM-DD dates', () => {
    expect(daysBetween('2026-03-15', '2026-04-15')).toBe(31);
    expect(daysBetween('2026-03-15', '2026-03-16')).toBe(1);
    expect(daysBetween('2026-03-15', '2026-03-15')).toBe(0);
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(364);
  });

  it('is unaffected by DST (uses local-midnight anchors)', () => {
    // US DST spring-forward is 2026-03-08; a naive UTC diff would be 30.96 days.
    expect(daysBetween('2026-03-01', '2026-03-31')).toBe(30);
  });

  it('returns a negative count when end precedes start', () => {
    expect(daysBetween('2026-04-15', '2026-03-15')).toBe(-31);
  });

  it('returns 0 for an unparseable input', () => {
    expect(daysBetween('nope', '2026-03-15')).toBe(0);
  });
});
