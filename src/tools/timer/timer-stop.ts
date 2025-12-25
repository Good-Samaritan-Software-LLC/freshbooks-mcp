/**
 * Timer Stop Tool
 *
 * Stops a running timer by updating the TimeEntry with active=false.
 * FreshBooks automatically calculates the duration based on the elapsed time
 * between startedAt and now.
 */

import { z } from "zod";
import { TimerStopInputSchema, TimerStopOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Tool definition for timer_stop
 */
export const timerStopTool = {
  name: "timer_stop",
  description: `Stop a running timer and log the time in FreshBooks.

WHEN TO USE:
- User says "stop timer", "stop tracking", "clock out"
- User finishes work on a task/project and wants to log the time
- User wants to pause work and save the time entry

HOW IT WORKS:
Updates the time entry with:
- active=false (timer stops running)
- isLogged=true (time is now logged)
- duration: Auto-calculated by FreshBooks from startedAt to now

AUTOMATIC DURATION CALCULATION:
FreshBooks automatically calculates the duration based on:
- startedAt: When timer was started
- Now: Current timestamp when stopped
- Result: Duration in seconds

REQUIRED:
- accountId: FreshBooks account ID
- timeEntryId: ID of the running timer (from timer_start or timer_current)

OPTIONAL:
- note: Update the description before stopping (adds/modifies work notes)

FINDING THE TIMER ID:
If you don't know the timer ID:
1. Use timer_current to get all active timers
2. The response includes the timeEntryId for each active timer

WHAT IF NO TIMER IS RUNNING:
- If the timeEntryId doesn't exist: Returns "not found" error
- If timer is already stopped: Updates it anyway (idempotent)

EXAMPLE USAGE:
- "Stop my timer" (requires getting current timer first)
- "Stop timer 12345"
- "Clock out and add note: completed bug fixes"

RETURNS:
Updated time entry with:
- id: The time entry ID
- active: false (timer has stopped)
- duration: Auto-calculated time in seconds
- startedAt: Original start time
- note: Work description (updated if provided)
- isLogged: true (time is now logged)`,

  inputSchema: TimerStopInputSchema,
  outputSchema: TimerStopOutputSchema,

  async execute(
    input: z.infer<typeof TimerStopInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimerStopOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timer_stop',
      async (input: z.infer<typeof TimerStopInputSchema>, _context: ToolContext) => {
        const { accountId, timeEntryId, note } = input;

        // Build the update data to stop the timer
        const updateData: Record<string, unknown> = {
          active: false, // Stop the timer
          isLogged: true, // Mark time as logged
          // Note: duration is auto-calculated by FreshBooks
        };

        // Optionally update the note
        if (note !== undefined) {
          updateData.note = note;
        }

        // Use the FreshBooks client to update the time entry
        const result = await client.executeWithRetry(
          "timer_stop",
          async (fbClient) => {
            const response = await fbClient.timeEntries.update(
              updateData as any,
              parseInt(accountId),
              timeEntryId
            );

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // Extract the time entry from the response
        // FreshBooks returns: { time_entry: { ... } }
        const timeEntry = (result as { time_entry?: unknown }).time_entry ?? result;

        return timeEntry as z.infer<typeof TimerStopOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
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
