/**
 * Timer Discard Tool
 *
 * Discards a running timer without logging the time by deleting the TimeEntry.
 * This is useful when you started a timer by mistake or want to abandon tracked time.
 */

import { z } from "zod";
import { TimerDiscardInputSchema, TimerDiscardOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

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
- timer_discard: DELETES the time entry, no record is kept

USE WITH CAUTION:
- This permanently deletes the time entry
- The tracked time CANNOT be recovered after discarding
- Use timer_stop if you want to keep the time entry

HOW IT WORKS:
Deletes the time entry completely:
- Time entry is removed from FreshBooks
- No duration is logged
- No record remains (except in audit logs)

REQUIRED:
- accountId: FreshBooks account ID
- timeEntryId: ID of the timer to discard (from timer_start or timer_current)

FINDING THE TIMER ID:
If you don't know the timer ID:
1. Use timer_current to get all active timers
2. The response includes the timeEntryId for each active timer

WHAT IF TIMER DOESN'T EXIST:
- If timeEntryId is not found: Returns error
- If timer already stopped/logged: Can still delete it (removes logged time)
- If timer already discarded: Returns error (not found)

CONFIRMATION:
Always confirm with the user before discarding:
- "Are you sure you want to discard this timer?"
- "This will delete the tracked time. Continue?"

EXAMPLE USAGE:
- "Discard my current timer" (requires getting current timer first)
- "Delete timer 12345"
- "Cancel time tracking - I didn't actually work on it"

RETURNS:
Confirmation object with:
- success: true if deletion succeeded
- timeEntryId: The ID that was deleted
- message: Confirmation message

ALTERNATIVE:
If user wants to keep the time but stop tracking:
- Use timer_stop instead
- This saves the time entry with calculated duration`,

  inputSchema: TimerDiscardInputSchema,
  outputSchema: TimerDiscardOutputSchema,

  async execute(
    input: z.infer<typeof TimerDiscardInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimerDiscardOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timer_discard',
      async (input: z.infer<typeof TimerDiscardInputSchema>, _context: ToolContext) => {
        const { accountId, timeEntryId } = input;

        // Use the FreshBooks client to delete the time entry
        await client.executeWithRetry(
          "timer_discard",
          async (fbClient) => {
            const response = await fbClient.timeEntries.delete(parseInt(accountId), timeEntryId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // Return success confirmation
        return {
          success: true,
          timeEntryId,
          message: `Timer ${timeEntryId} has been discarded successfully. The time entry was deleted and no time was logged.`,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
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
