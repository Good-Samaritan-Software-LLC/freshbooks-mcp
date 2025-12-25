/**
 * Timer Start Tool
 *
 * Starts a new timer by creating a TimeEntry with active=true and duration=0.
 * Note: FreshBooks typically allows only one active timer per user at a time.
 */

import { z } from "zod";
import { TimerStartInputSchema, TimerStartOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Tool definition for timer_start
 */
export const timerStartTool = {
  name: "timer_start",
  description: `Start a new timer for time tracking in FreshBooks.

WHEN TO USE:
- User says "start timer", "begin tracking time", "clock in"
- User wants to track time on a task or project
- Starting work on billable hours

HOW IT WORKS:
Creates a new time entry with:
- active=true (timer is running)
- duration=0 (will auto-calculate when stopped)
- startedAt=now (start time)
- isLogged=false (not yet logged as completed time)

IMPORTANT NOTES:
- FreshBooks typically allows only ONE active timer per user
- If a timer is already running, you may need to stop it first
- The timer will continue running until explicitly stopped
- Duration is auto-calculated from startedAt when stopped

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)

OPTIONAL BUT HELPFUL:
- projectId: Associate timer with a specific project (recommended for billing)
- clientId: Associate timer with a client
- serviceId: Type of service/work being performed
- taskId: Specific task within a project
- note: Description of work being performed (can be updated when stopping)
- billable: Whether time is billable (default: true)
- internal: Whether this is internal work (default: false)

EXAMPLE USAGE:
- "Start a timer for Project Alpha"
- "Begin tracking time on bug fixes"
- "Clock in for client meeting"

RETURNS:
Created time entry with:
- id: Use this ID to stop or discard the timer later
- active: true (timer is running)
- duration: 0 (will be calculated when stopped)
- startedAt: When timer started
- timer: Active timer object with isRunning=true`,

  inputSchema: TimerStartInputSchema,
  outputSchema: TimerStartOutputSchema,

  async execute(
    input: z.infer<typeof TimerStartInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimerStartOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timer_start',
      async (input: z.infer<typeof TimerStartInputSchema>, _context: ToolContext) => {
        const { accountId, projectId, clientId, serviceId, taskId, note, billable, internal } = input;

        // Build the time entry data for creating an active timer
        const timeEntryData: Record<string, unknown> = {
          // Timer-specific fields
          active: true, // This makes it an active timer
          duration: 0, // Timer starts with 0 duration
          isLogged: false, // Not yet logged as completed time
          startedAt: new Date().toISOString(), // Start time is now

          // Optional associations
          ...(projectId !== undefined && { projectId }),
          ...(clientId !== undefined && { clientId }),
          ...(serviceId !== undefined && { serviceId }),
          ...(taskId !== undefined && { taskId }),
          ...(note !== undefined && { note }),

          // Optional flags
          ...(billable !== undefined && { billable }),
          ...(internal !== undefined && { internal }),
        };

        // Use the FreshBooks client to create the time entry
        const result = await client.executeWithRetry(
          "timer_start",
          async (fbClient) => {
            const response = await fbClient.timeEntries.create(timeEntryData as any, parseInt(accountId));

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // Extract the time entry from the response
        // FreshBooks returns: { time_entry: { ... } }
        const timeEntry = (result as { time_entry?: unknown }).time_entry ?? result;

        return timeEntry as z.infer<typeof TimerStartOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};

/**
 * Wrapped handler for backward compatibility with tests
 */
export async function timerStartHandler(
  input: z.infer<typeof TimerStartInputSchema>,
  context: ToolContext & { client: FreshBooksClientWrapper }
): Promise<z.infer<typeof TimerStartOutputSchema>> {
  return timerStartTool.execute(input, context.client);
}
