/**
 * timeentry_create Tool
 *
 * Create a new time entry in FreshBooks.
 */

import { z } from 'zod';
import { TimeEntryCreateInputSchema, TimeEntrySingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for timeentry_create
 */
export const timeentryCreateTool = {
  name: 'timeentry_create',
  description: `Create a new time entry in FreshBooks.

WHEN TO USE:
- User says "log my time", "track time", "record hours", "add time entry"
- User mentions working on a project with duration
- User wants to record billable or non-billable time
- User asks "log 2 hours on project X", "track 45 minutes of work"

REQUIRED:
- businessId: FreshBooks business ID (get from user_me -> businessMemberships[].business.id)
- duration: Time in seconds (or ask user for hours/minutes and convert)
  * 1 hour = 3600 seconds
  * 1 minute = 60 seconds
  * Example: 2 hours 30 minutes = 9000 seconds

OPTIONAL BUT RECOMMENDED:
- note: Description of work performed (improves billing accuracy)
- projectId: Associate with a project
- clientId: Associate with a client
- serviceId: Service type for billing categorization
- taskId: Associate with a task
- billable: Whether time is billable (default: true if isLogged=true)
- startedAt: When work began (ISO 8601 format, defaults to now)
- isLogged: Whether time is logged (default: true)
  * Set to false for active timers (with duration=0 and active=true)

SPECIAL CASES:
- To start a timer: Set duration=0, active=true, isLogged=false
- For completed work: Set duration to actual seconds, isLogged=true

RETURNS:
Created time entry with:
- id: New time entry ID (save this for updates/deletes)
- duration: Confirmed duration in seconds
- All other time entry fields

EXAMPLES:
User says: "Log 2 hours on Project Alpha for code review"
→ duration: 7200 (2 * 3600)
→ note: "code review"
→ projectId: (look up Project Alpha)

User says: "Track 45 minutes of meeting time"
→ duration: 2700 (45 * 60)
→ note: "meeting"

User says: "Record 3 hours of development work for client ABC"
→ duration: 10800 (3 * 3600)
→ note: "development work"
→ clientId: (look up client ABC)`,

  inputSchema: TimeEntryCreateInputSchema,
  outputSchema: TimeEntrySingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof TimeEntryCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimeEntrySingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timeentry_create',
      async (
        input: z.infer<typeof TimeEntryCreateInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Creating time entry', {
          businessId: input.businessId,
          duration: input.duration,
          projectId: input.projectId,
          isLogged: input.isLogged,
        });

        const result = await client.executeWithRetry(
          'timeentry_create',
          async (fbClient) => {
            // Build time entry data object
            const timeEntryData: any = {
              duration: input.duration,
              isLogged: input.isLogged,
            };

            // Add startedAt (default to now if not specified)
            if (input.startedAt) {
              timeEntryData.startedAt = new Date(input.startedAt);
            } else {
              timeEntryData.startedAt = new Date();
            }

            // Add optional fields if provided
            if (input.note !== undefined) {
              timeEntryData.note = input.note;
            }
            if (input.projectId !== undefined) {
              timeEntryData.projectId = input.projectId;
            }
            if (input.clientId !== undefined) {
              timeEntryData.clientId = input.clientId;
            }
            if (input.serviceId !== undefined) {
              timeEntryData.serviceId = input.serviceId;
            }
            if (input.taskId !== undefined) {
              timeEntryData.taskId = input.taskId;
            }
            if (input.billable !== undefined) {
              timeEntryData.billable = input.billable;
            }
            if (input.active !== undefined) {
              timeEntryData.active = input.active;
            }
            if (input.internal !== undefined) {
              timeEntryData.internal = input.internal;
            }
            if (input.retainerId !== undefined) {
              timeEntryData.retainerId = input.retainerId;
            }

            const response = await fbClient.timeEntries.create(
              timeEntryData,
              input.businessId
            );

            if (!response.ok) {
              throw response.error;
            }

            if (!response.data) {
              throw ErrorHandler.createValidationError(
                'Failed to create time entry: No data returned from API'
              );
            }

            return response.data;
          }
        );

        logger.info('Time entry created successfully', {
          timeEntryId: result.id,
          duration: result.duration,
          isLogged: result.isLogged,
        });

        return result as any;
      }
    );

    return handler(input, { businessId: input.businessId }) as any;
  },
};
