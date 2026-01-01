/**
 * Timer Current Tool
 *
 * Gets the currently running timer(s) using the /comments/business/.../timers endpoint.
 * This endpoint is not supported by the SDK, so we use raw HTTP.
 *
 * Note: The SDK uses /timetracking/business/... but timer operations require /comments/business/...
 */

import { z } from "zod";
import { TimerCurrentInputSchema, TimerCurrentOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Timer response from /comments/business/.../timers
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
      timer?: { id: number; is_running?: boolean } | null;
    }>;
  }>;
}

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
- businessId: FreshBooks business ID (get from user_me -> businessMemberships[].business.id)

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
        const { businessId } = input;

        // Use raw HTTP to access /comments/business/.../timers endpoint
        // The SDK doesn't support this endpoint - it only has /timetracking/business/...
        const result = await client.executeRawWithRetry<TimerApiResponse>(
          'GET',
          `/comments/business/${businessId}/timers`,
          undefined,
          'timer_current'
        );

        if (!result.ok || !result.data) {
          throw result.error || new Error('Failed to fetch timers');
        }

        const timers = result.data.timers || [];

        // Transform timers to the expected output format
        // Each timer contains time_entries, and we want to expose the active ones
        const activeTimers = timers.map(timer => {
          // Get the most recent time entry for this timer
          const timeEntries = timer.time_entries || [];
          const activeEntry = timeEntries.find(te => te.duration === null) || timeEntries[0];

          return {
            id: activeEntry?.id || timer.id,
            timerId: timer.id,
            isRunning: timer.is_running,
            identityId: undefined,
            isLogged: activeEntry?.is_logged ?? false,
            startedAt: activeEntry?.started_at || '',
            createdAt: activeEntry?.created_at,
            clientId: activeEntry?.client_id,
            projectId: activeEntry?.project_id,
            taskId: activeEntry?.task_id,
            serviceId: activeEntry?.service_id,
            note: activeEntry?.note,
            active: activeEntry?.active ?? timer.is_running,
            billable: activeEntry?.billable ?? false,
            billed: activeEntry?.billed,
            internal: activeEntry?.internal,
            duration: activeEntry?.duration ?? 0,
            timer: {
              id: timer.id,
              isRunning: timer.is_running,
            },
            // Include all time entries for duration calculation
            timeEntries: timeEntries.map(te => ({
              id: te.id,
              duration: te.duration,
              startedAt: te.started_at,
              isLogged: te.is_logged,
            })),
          };
        });

        return {
          activeTimers,
          count: timers.length,
        } as z.infer<typeof TimerCurrentOutputSchema>;
      }
    );

    return handler(input, { businessId: input.businessId });
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
