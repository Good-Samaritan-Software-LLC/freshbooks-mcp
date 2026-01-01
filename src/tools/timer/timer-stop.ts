/**
 * Timer Stop Tool
 *
 * Stops a running timer and logs the time using the /comments/business/.../timers endpoint.
 * This endpoint is not supported by the SDK, so we use raw HTTP.
 *
 * Note: The SDK uses /timetracking/business/... but timer operations require /comments/business/...
 */

import { z } from "zod";
import { TimerStopInputSchema, TimerStopOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Timer API response structure
 */
interface TimerApiResponse {
  timers: Array<{
    id: number;
    is_running: boolean;
    time_entries?: Array<{
      id: number;
      is_logged: boolean;
      started_at: string;
      created_at?: string;
      client_id: number | null;
      project_id: number | null;
      task_id?: number | null;
      service_id?: number | null;
      note: string | null;
      active: boolean;
      billable: boolean;
      billed?: boolean;
      internal?: boolean;
      duration: number | null;
    }>;
  }>;
}

/**
 * Tool definition for timer_stop
 */
export const timerStopTool = {
  name: "timer_stop",
  description: `Stop a running timer and log the time in FreshBooks.

WHEN TO USE:
- User says "stop timer", "stop tracking", "clock out"
- User finishes work on a task/project and wants to log the time
- User wants to save and log the time entry

HOW IT WORKS:
1. Gets the current timer to calculate total duration
2. Aggregates duration across all time entry segments
3. Updates the timer to mark time as logged and billable

REQUIRED:
- businessId: FreshBooks business ID (get from user_me -> businessMemberships[].business.id)

OPTIONAL:
- timerId: ID of the timer to stop (from timer_current). If not provided, stops the current running timer.
- note: Update the description before stopping

WHAT IF NO TIMER IS RUNNING:
- Returns error if no active timer found

EXAMPLE USAGE:
- "Stop my timer" (auto-detects current timer)
- "Stop timer and add note: completed bug fixes"

RETURNS:
Stopped time entry with:
- id: The time entry ID
- timerId: The timer ID
- active: false (timer has stopped)
- duration: Total calculated time in seconds
- isLogged: true (time is now logged)
- billable: true (time is marked billable)`,

  inputSchema: TimerStopInputSchema,
  outputSchema: TimerStopOutputSchema,

  async execute(
    input: z.infer<typeof TimerStopInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimerStopOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timer_stop',
      async (input: z.infer<typeof TimerStopInputSchema>, _context: ToolContext) => {
        const { businessId, timerId, timeEntryId, note } = input;

        // First, get current timers to find the one to stop
        const timersResult = await client.executeRawWithRetry<TimerApiResponse>(
          'GET',
          `/comments/business/${businessId}/timers`,
          undefined,
          'timer_stop_get_timers'
        );

        if (!timersResult.ok || !timersResult.data) {
          throw timersResult.error || new Error('Failed to fetch timers');
        }

        const timers = timersResult.data.timers || [];

        if (timers.length === 0) {
          throw new Error('No timer found to stop');
        }

        // Find the timer to stop
        let targetTimer = timers[0]; // Default to first timer

        if (timerId) {
          const found = timers.find(t => t.id === timerId);
          if (!found) {
            throw new Error(`Timer with ID ${timerId} not found`);
          }
          targetTimer = found;
        } else if (timeEntryId) {
          // Legacy: find timer containing this time entry
          const found = timers.find(t =>
            t.time_entries?.some(te => te.id === timeEntryId)
          );
          if (found) {
            targetTimer = found;
          }
        }

        if (!targetTimer) {
          throw new Error('No timer found to stop');
        }

        const timeEntries = targetTimer.time_entries || [];

        if (timeEntries.length === 0) {
          throw new Error('Timer has no time entries');
        }

        // Calculate total duration across all time entry segments
        let totalDuration = timeEntries.reduce((total, entry) => {
          return entry.duration ? total + Math.floor(entry.duration) : total;
        }, 0);

        // Add duration for currently running segment (duration === null)
        if (targetTimer.is_running) {
          const runningEntry = timeEntries.find(te => te.duration === null);
          if (runningEntry) {
            const startTime = new Date(runningEntry.started_at).getTime();
            const now = Date.now();
            const runningDuration = Math.floor((now - startTime) / 1000);
            totalDuration += runningDuration;
          }
        }

        if (totalDuration === 0) {
          throw new Error('No time to log, timer has no duration');
        }

        // Get the first time entry as the base for the update
        const sourceEntry = timeEntries[0]!;

        // Build the payload to stop and log the timer
        // This matches the FreshBooks website behavior
        const updatePayload = {
          timer: {
            time_entries: [{
              id: sourceEntry.id,
              is_logged: sourceEntry.is_logged,
              started_at: sourceEntry.started_at,
              client_id: sourceEntry.client_id,
              project_id: sourceEntry.project_id,
              task_id: sourceEntry.task_id,
              service_id: sourceEntry.service_id,
              note: note ?? sourceEntry.note,
              active: false,
              billable: true, // Mark as billable when stopping
              billed: sourceEntry.billed ?? false,
              internal: sourceEntry.internal ?? false,
              duration: totalDuration,
            }],
          },
        };

        // PUT to /timers/{id} to stop and log
        const result = await client.executeRawWithRetry(
          'PUT',
          `/comments/business/${businessId}/timers/${targetTimer.id}`,
          updatePayload,
          'timer_stop'
        );

        if (!result.ok) {
          throw result.error || new Error('Failed to stop timer');
        }

        // Return the stopped time entry info
        return {
          id: sourceEntry.id,
          timerId: targetTimer.id,
          identityId: undefined,
          isLogged: true,
          startedAt: sourceEntry.started_at,
          createdAt: sourceEntry.created_at,
          clientId: sourceEntry.client_id,
          projectId: sourceEntry.project_id,
          taskId: sourceEntry.task_id,
          serviceId: sourceEntry.service_id,
          note: note ?? sourceEntry.note,
          active: false,
          billable: true,
          billed: sourceEntry.billed,
          internal: sourceEntry.internal,
          duration: totalDuration,
          timer: {
            id: targetTimer.id,
            isRunning: false,
          },
        } as z.infer<typeof TimerStopOutputSchema>;
      }
    );

    return handler(input, { businessId: input.businessId });
  },
};

/**
 * Wrapped handler for backward compatibility with tests
 */
export async function timerStopHandler(
  input: z.infer<typeof TimerStopInputSchema>,
  context: ToolContext & { client: FreshBooksClientWrapper }
): Promise<z.infer<typeof TimerStopOutputSchema>> {
  return timerStopTool.execute(input, context.client);
}
