/**
 * Timer Start Tool
 *
 * Starts a new timer using the /comments/business/.../time_entries endpoint.
 * This endpoint is not supported by the SDK, so we use raw HTTP.
 *
 * Note: The SDK uses /timetracking/business/... but timer operations require /comments/business/...
 */

import { z } from "zod";
import { TimerStartInputSchema, TimerStartOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Response from creating a time entry (starting a timer)
 */
interface TimeEntryCreateResponse {
  time_entry: {
    id: number;
    identity_id?: number;
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
  };
}

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
- businessId: FreshBooks business ID (get from user_me -> businessMemberships[].business.id)

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
        const { businessId, projectId, clientId, serviceId, taskId, note, billable, internal } = input;

        // Build the time entry payload using snake_case (raw API format)
        // This matches the format used by the FreshBooks website
        const timeEntryPayload = {
          time_entry: {
            is_logged: false,
            duration: null, // null for active timer
            note: note ?? null,
            internal: internal ?? false,
            retainer_id: null,
            pending_client: null,
            pending_project: null,
            pending_task: null,
            source: null,
            started_at: new Date().toISOString(),
            local_started_at: null,
            local_timezone: null,
            billable: billable ?? false,
            billed: false,
            timer: {}, // Empty object for new timer
            identity_id: null,
            client_id: clientId ?? null,
            project_id: projectId ?? null,
            service_id: serviceId ?? null,
            task_id: taskId ?? null,
          },
        };

        // Use raw HTTP to POST to /comments/business/.../time_entries
        const result = await client.executeRawWithRetry<TimeEntryCreateResponse>(
          'POST',
          `/comments/business/${businessId}/time_entries`,
          timeEntryPayload,
          'timer_start'
        );

        if (!result.ok || !result.data) {
          throw result.error || new Error('Failed to start timer');
        }

        const te = result.data.time_entry;

        // Transform to camelCase output format
        return {
          id: te.id,
          identityId: te.identity_id,
          isLogged: te.is_logged,
          startedAt: te.started_at,
          createdAt: te.created_at,
          clientId: te.client_id,
          projectId: te.project_id,
          taskId: te.task_id,
          serviceId: te.service_id,
          note: te.note,
          active: te.active,
          billable: te.billable,
          billed: te.billed,
          internal: te.internal,
          duration: te.duration ?? 0,
          timer: te.timer ? {
            id: te.timer.id,
            isRunning: te.timer.is_running ?? true,
          } : null,
        } as z.infer<typeof TimerStartOutputSchema>;
      }
    );

    return handler(input, { businessId: input.businessId });
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
