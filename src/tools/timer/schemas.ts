/**
 * Timer Tool Schemas
 *
 * Zod schemas for Timer operations.
 * Note: Timer is not a standalone resource - it's managed through TimeEntry.
 */

import { z } from "zod";

/**
 * Base schema for all timer operations
 * All timer operations require a business ID (since timers use the timeEntries SDK which expects businessId)
 */
export const TimerBusinessIdSchema = z.object({
  businessId: z.number().int().positive().describe("FreshBooks business ID (get from user_me -> businessMemberships[].business.id)"),
});

/**
 * Input schema for starting a new timer
 */
export const TimerStartInputSchema = TimerBusinessIdSchema.extend({
  projectId: z.number().optional().describe("Project to associate with timer"),
  clientId: z.number().optional().describe("Client to associate with timer"),
  serviceId: z.number().optional().describe("Service/task type being worked on"),
  taskId: z.number().optional().describe("Specific task being worked on"),
  note: z.string().optional().describe("Description of work being performed"),
  billable: z.boolean().optional().default(true).describe("Whether this time is billable"),
  internal: z.boolean().optional().default(false).describe("Whether this is internal work"),
});

/**
 * Input schema for stopping a running timer
 * Note: timerId is preferred. If not provided, will auto-detect from current running timer.
 */
export const TimerStopInputSchema = TimerBusinessIdSchema.extend({
  timerId: z.number().optional().describe("ID of the timer to stop (from timer_current -> timerId). If not provided, stops the current running timer."),
  timeEntryId: z.number().optional().describe("DEPRECATED: Use timerId instead. Kept for backwards compatibility."),
  note: z.string().optional().describe("Update the note/description before stopping"),
});

/**
 * Input schema for getting the current timer
 * Only requires businessId - will return active timers for the user
 */
export const TimerCurrentInputSchema = TimerBusinessIdSchema;

/**
 * Input schema for discarding a timer
 * Note: timerId is preferred. If not provided, will auto-detect from current timer.
 */
export const TimerDiscardInputSchema = TimerBusinessIdSchema.extend({
  timerId: z.number().optional().describe("ID of the timer to discard (from timer_current -> timerId). If not provided, discards the current timer."),
  timeEntryId: z.number().optional().describe("DEPRECATED: Use timerId instead. Kept for backwards compatibility."),
});

/**
 * Timer object embedded in TimeEntry
 * This matches the Timer structure from FreshBooks
 */
export const TimerSchema = z.object({
  id: z.number().describe("Timer ID"),
  isRunning: z.boolean().nullable().describe("Whether timer is currently running"),
});

/**
 * Time Entry schema (simplified for timer operations)
 */
export const TimeEntrySchema = z.object({
  id: z.number().describe("Time entry ID"),
  identityId: z.number().optional().describe("User identity ID"),
  isLogged: z.boolean().describe("Whether time is logged"),
  startedAt: z.string().describe("When timer started (ISO 8601)"),
  createdAt: z.string().optional().describe("When entry was created (ISO 8601)"),
  clientId: z.number().nullable().optional().describe("Associated client ID"),
  projectId: z.number().nullable().optional().describe("Associated project ID"),
  taskId: z.number().nullable().optional().describe("Associated task ID"),
  serviceId: z.number().nullable().optional().describe("Associated service ID"),
  note: z.string().nullable().optional().describe("Work description"),
  active: z.boolean().describe("Whether timer is active/running"),
  billable: z.boolean().optional().describe("Whether time is billable"),
  billed: z.boolean().optional().describe("Whether time has been billed"),
  internal: z.boolean().optional().describe("Whether this is internal work"),
  duration: z.number().describe("Duration in seconds"),
  timer: TimerSchema.nullable().optional().describe("Active timer object if present"),
  pendingClient: z.string().nullable().optional().describe("Unconfirmed client name"),
  pendingProject: z.string().nullable().optional().describe("Unconfirmed project name"),
  pendingTask: z.string().nullable().optional().describe("Unconfirmed task name"),
  retainerId: z.number().nullable().optional().describe("Associated retainer ID"),
});

/**
 * Output schema for timer_start
 * Returns the created time entry with active timer
 */
export const TimerStartOutputSchema = TimeEntrySchema;

/**
 * Output schema for timer_stop
 * Returns the stopped time entry with calculated duration
 */
export const TimerStopOutputSchema = TimeEntrySchema;

/**
 * Output schema for timer_current
 * Returns array of active time entries (typically 0 or 1)
 */
export const TimerCurrentOutputSchema = z.object({
  activeTimers: z.array(TimeEntrySchema).describe("Currently running timers"),
  count: z.number().describe("Number of active timers"),
});

/**
 * Output schema for timer_discard
 * Returns confirmation of deletion
 */
export const TimerDiscardOutputSchema = z.object({
  success: z.boolean().describe("Whether timer was successfully discarded"),
  timeEntryId: z.number().describe("ID of the discarded time entry"),
  message: z.string().describe("Confirmation message"),
});
