/**
 * Regression tests: businessId must accept NUMERIC STRINGS.
 *
 * The hosted server types businessId as a string end-to-end (DB ->
 * lib/mcp/auth.ts -> tool-bridge injection), while these tools declared
 * `z.number()`. Before the execute()-boundary validation (PR #74/#75) the
 * string sailed through into URL paths and worked; once boundary validation
 * landed, EVERY hosted project/time-entry/timer/service call failed with:
 *   Validation failed for "businessId": Invalid input: expected number, received string
 * Fix: z.coerce.number() on every businessId input field.
 */

import { describe, it, expect } from 'vitest';
import type { z } from 'zod';

import {
  projectCreateTool,
  projectUpdateTool,
  projectListTool,
  projectSingleTool,
  projectDeleteTool,
  timeentryCreateTool,
  timeentryUpdateTool,
  timeentryListTool,
  timeentrySingleTool,
  timeentryDeleteTool,
  timerStartTool,
  timerStopTool,
  timerCurrentTool,
  timerDiscardTool,
  serviceCreateTool,
  serviceListTool,
  serviceSingleTool,
  serviceRateGetTool,
  serviceRateSetTool,
} from '../../src/tools/index.js';

type ToolLike = { name: string; inputSchema: z.ZodTypeAny };

// Every tool whose input requires businessId, with the minimal other fields
// its schema requires.
const TOOLS: Array<[ToolLike, Record<string, unknown>]> = [
  [projectCreateTool, { title: 'T' }],
  [projectUpdateTool, { projectId: 1 }],
  [projectListTool, {}],
  [projectSingleTool, { projectId: 1 }],
  [projectDeleteTool, { projectId: 1 }],
  [timeentryCreateTool, { duration: 60 }],
  [timeentryUpdateTool, { timeEntryId: 1 }],
  [timeentryListTool, {}],
  [timeentrySingleTool, { timeEntryId: 1 }],
  [timeentryDeleteTool, { timeEntryId: 1 }],
  [timerStartTool, {}],
  [timerStopTool, {}],
  [timerCurrentTool, {}],
  [timerDiscardTool, {}],
  [serviceCreateTool, { name: 'S' }],
  [serviceListTool, {}],
  [serviceSingleTool, { serviceId: 1 }],
  [serviceRateGetTool, { serviceId: 1 }],
  [serviceRateSetTool, { serviceId: 1, rate: '75.00' }],
];

describe('businessId coercion (hosted server passes a string)', () => {
  it.each(TOOLS.map(([tool, extra]) => [tool.name, tool, extra] as const))(
    '%s accepts businessId as a numeric string',
    (_name, tool, extra) => {
      const result = tool.inputSchema.safeParse({ businessId: '12345', ...extra });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { businessId: number }).businessId).toBe(12345);
      }
    }
  );

  it.each(TOOLS.map(([tool, extra]) => [tool.name, tool, extra] as const))(
    '%s still accepts businessId as a number',
    (_name, tool, extra) => {
      const result = tool.inputSchema.safeParse({ businessId: 12345, ...extra });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { businessId: number }).businessId).toBe(12345);
      }
    }
  );

  it.each(TOOLS.map(([tool, extra]) => [tool.name, tool, extra] as const))(
    '%s rejects a non-numeric businessId string',
    (_name, tool, extra) => {
      expect(tool.inputSchema.safeParse({ businessId: 'abc', ...extra }).success).toBe(false);
    }
  );

  it('rejects non-positive businessId values (string or number)', () => {
    expect(projectCreateTool.inputSchema.safeParse({ businessId: '-3', title: 'T' }).success).toBe(false);
    expect(projectCreateTool.inputSchema.safeParse({ businessId: 0, title: 'T' }).success).toBe(false);
  });
});
