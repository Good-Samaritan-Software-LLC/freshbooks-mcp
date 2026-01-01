/**
 * Timer Discard Tool
 *
 * Discards a running timer without logging the time using DELETE /comments/business/.../timers.
 * This endpoint is not supported by the SDK, so we use raw HTTP.
 *
 * Note: The SDK uses /timetracking/business/... but timer operations require /comments/business/...
 */

import { z } from "zod";
import { TimerDiscardInputSchema, TimerDiscardOutputSchema } from "./schemas.js";
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
    }>;
  }>;
}

/**
 * Tool definition for timer_discard
 */
export const timerDiscardTool = {
  name: "timer_discard",
  description: `Discard a running timer without logging the time in FreshBooks.

WHEN TO USE:
- User says "discard timer", "delete timer", "cancel tracking"
- Timer was started by mistake
- Work was not actually performed
- Want to abandon tracked time without saving

IMPORTANT DIFFERENCE: Discard vs Stop
- timer_stop: Logs the time, saves the time entry with calculated duration
- timer_discard: DELETES the timer completely, no record is kept

USE WITH CAUTION:
- This permanently deletes the timer and all its time entries
- The tracked time CANNOT be recovered after discarding
- Use timer_stop if you want to keep and log the time entry

HOW IT WORKS:
Deletes the timer completely:
- Timer and all time entries are removed from FreshBooks
- No duration is logged
- No record remains

REQUIRED:
- businessId: FreshBooks business ID (get from user_me -> businessMemberships[].business.id)

OPTIONAL:
- timerId: ID of the timer to discard (from timer_current). If not provided, discards the current timer.

WHAT IF NO TIMER EXISTS:
- Returns error if no timer found

EXAMPLE USAGE:
- "Discard my current timer" (auto-detects current timer)
- "Delete timer - I didn't actually work on it"
- "Cancel time tracking"

RETURNS:
Confirmation object with:
- success: true if deletion succeeded
- timeEntryId: The first time entry ID that was deleted
- message: Confirmation message`,

  inputSchema: TimerDiscardInputSchema,
  outputSchema: TimerDiscardOutputSchema,

  async execute(
    input: z.infer<typeof TimerDiscardInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimerDiscardOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timer_discard',
      async (input: z.infer<typeof TimerDiscardInputSchema>, _context: ToolContext) => {
        const { businessId, timerId, timeEntryId } = input;

        // First, get current timers to find the one to discard
        const timersResult = await client.executeRawWithRetry<TimerApiResponse>(
          'GET',
          `/comments/business/${businessId}/timers`,
          undefined,
          'timer_discard_get_timers'
        );

        if (!timersResult.ok || !timersResult.data) {
          throw timersResult.error || new Error('Failed to fetch timers');
        }

        const timers = timersResult.data.timers || [];

        if (timers.length === 0) {
          throw new Error('No timer found to discard');
        }

        // Find the timer to discard
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
          throw new Error('No timer found to discard');
        }

        const targetTimerId = targetTimer.id;
        const firstTimeEntryId = targetTimer.time_entries?.[0]?.id ?? targetTimerId;

        // DELETE /timers/{id} to discard
        const result = await client.executeRawWithRetry(
          'DELETE',
          `/comments/business/${businessId}/timers/${targetTimerId}`,
          undefined,
          'timer_discard'
        );

        // Successful delete returns 204 No Content
        if (!result.ok && result.status !== 204) {
          throw result.error || new Error('Failed to discard timer');
        }

        // Return success confirmation
        return {
          success: true,
          timeEntryId: firstTimeEntryId,
          message: `Timer ${targetTimerId} has been discarded successfully. The time entry was deleted and no time was logged.`,
        };
      }
    );

    return handler(input, { businessId: input.businessId });
  },
};

/**
 * Wrapped handler for backward compatibility with tests
 */
export async function timerDiscardHandler(
  input: z.infer<typeof TimerDiscardInputSchema>,
  context: ToolContext & { client: FreshBooksClientWrapper }
): Promise<z.infer<typeof TimerDiscardOutputSchema>> {
  return timerDiscardTool.execute(input, context.client);
}
