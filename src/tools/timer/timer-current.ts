/**
 * Timer Current Tool
 *
 * Gets the currently running timer(s) by listing TimeEntries with active=true.
 * Typically returns 0 or 1 timer, as FreshBooks usually allows only one active timer per user.
 */

import { z } from "zod";
import { TimerCurrentInputSchema, TimerCurrentOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Tool definition for timer_current
 */
export const timerCurrentTool = {
  name: "timer_current",
  description: `Get the currently running timer(s) in FreshBooks.

WHEN TO USE:
- User asks "what timer is running?", "show my current timer", "am I tracking time?"
- Need to find timer ID before stopping it
- Want to check if any timer is active before starting a new one
- Need to see timer details (duration so far, project, notes)

HOW IT WORKS:
Searches for time entries with:
- active=true (timer is currently running)
- Returns all matching entries (typically 0 or 1)

TYPICAL RESULTS:
- 0 timers: No timer is currently running
- 1 timer: The active timer with details
- Multiple timers: Rare, but possible in some FreshBooks configurations

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)

NO ACTIVE TIMER:
If no timer is running, returns:
- activeTimers: [] (empty array)
- count: 0

ACTIVE TIMER DETAILS:
Each active timer includes:
- id: Time entry ID (use this to stop or discard)
- startedAt: When timer started (ISO 8601 timestamp)
- duration: Current duration in seconds (calculated from start time)
- projectId: Associated project (if any)
- clientId: Associated client (if any)
- note: Work description (if any)
- billable: Whether time is billable
- timer: Nested timer object with isRunning=true

CALCULATING ELAPSED TIME:
The duration field shows elapsed seconds, but it may not be real-time.
To calculate current elapsed time:
- Parse startedAt timestamp
- Calculate difference from now
- Result is current elapsed time

EXAMPLE USAGE:
- "Show my current timer"
- "What am I tracking time for?"
- "How long has my timer been running?"
- "Is there a timer running?"

NEXT STEPS:
If timer is found, you can:
- Stop it: Use timer_stop with the returned id
- Discard it: Use timer_discard with the returned id
- Continue running: Do nothing, timer keeps tracking`,

  inputSchema: TimerCurrentInputSchema,
  outputSchema: TimerCurrentOutputSchema,

  async execute(
    input: z.infer<typeof TimerCurrentInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimerCurrentOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timer_current',
      async (input: z.infer<typeof TimerCurrentInputSchema>, _context: ToolContext) => {
        const { accountId } = input;

        // Use the FreshBooks client to list active time entries
        const result = await client.executeWithRetry(
          "timer_current",
          async (fbClient) => {
            // Import SearchQueryBuilder from SDK
            const { SearchQueryBuilder } = await import(
              '@freshbooks/api/dist/models/builders/index.js'
            );

            // Build search query for active timers
            const searchQuery = new SearchQueryBuilder();
            searchQuery.boolean("active", true);

            const response = await fbClient.timeEntries.list(parseInt(accountId), [searchQuery]);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // Extract time entries from response
        // FreshBooks returns: { time_entries: [...], meta: { ... } }
        const timeEntries = (result as { time_entries?: unknown[] }).time_entries ?? [];

        // Return normalized output
        return {
          activeTimers: timeEntries,
          count: timeEntries.length,
        } as z.infer<typeof TimerCurrentOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};

/**
 * Wrapped handler for backward compatibility with tests
 */
export async function timerCurrentHandler(
  input: z.infer<typeof TimerCurrentInputSchema>,
  context: ToolContext & { client: FreshBooksClientWrapper }
): Promise<z.infer<typeof TimerCurrentOutputSchema>> {
  return timerCurrentTool.execute(input, context.client);
}
