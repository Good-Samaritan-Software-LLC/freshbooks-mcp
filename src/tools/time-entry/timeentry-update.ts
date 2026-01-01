/**
 * timeentry_update Tool
 *
 * Update an existing time entry in FreshBooks.
 */

import { z } from 'zod';
import { TimeEntryUpdateInputSchema, TimeEntrySingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for timeentry_update
 */
export const timeentryUpdateTool = {
  name: 'timeentry_update',
  description: `Update an existing time entry in FreshBooks.

WHEN TO USE:
- User wants to modify a time entry
- User says "update time entry X", "change the duration", "edit my time log"
- User needs to correct duration, note, or project association
- User wants to stop a running timer (set active=false)
- User asks "update entry 123 to 3 hours", "change project on entry 456"

REQUIRED:
- businessId: FreshBooks business ID (get from user_me -> businessMemberships[].business.id)
- timeEntryId: ID of the time entry to update

OPTIONAL (provide only fields to change):
- duration: New duration in seconds
- note: New or updated description
- projectId: Change project association (null to remove)
- clientId: Change client association (null to remove)
- serviceId: Change service association (null to remove)
- taskId: Change task association (null to remove)
- billable: Change billable status
- active: Stop/start timer (false to stop, true to restart)
- isLogged: Change logged status
- startedAt: Change start time
- internal: Change internal work flag
- retainerId: Change retainer association

COMMON USE CASES:
1. Stop a running timer:
   - Set active=false (duration auto-calculated from startedAt)

2. Change duration:
   - Set new duration in seconds

3. Update note:
   - Set new note text

4. Change project:
   - Set new projectId

5. Make non-billable:
   - Set billable=false

RETURNS:
Updated time entry with all fields (including unchanged ones)

EXAMPLES:
User says: "Update time entry 123 to 3 hours"
→ timeEntryId: 123
→ duration: 10800

User says: "Stop timer 456"
→ timeEntryId: 456
→ active: false

User says: "Change the note on entry 789 to 'code review'"
→ timeEntryId: 789
→ note: "code review"

User says: "Make entry 321 non-billable"
→ timeEntryId: 321
→ billable: false`,

  inputSchema: TimeEntryUpdateInputSchema,
  outputSchema: TimeEntrySingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof TimeEntryUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimeEntrySingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timeentry_update',
      async (
        input: z.infer<typeof TimeEntryUpdateInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Updating time entry', {
          businessId: input.businessId,
          timeEntryId: input.timeEntryId,
          fields: Object.keys(input).filter(
            (k) => k !== 'businessId' && k !== 'timeEntryId'
          ),
        });

        const result = await client.executeWithRetry(
          'timeentry_update',
          async (fbClient) => {
            // First, fetch the existing time entry
            const existingResponse = await fbClient.timeEntries.single(
              input.businessId,
              input.timeEntryId
            );

            if (!existingResponse.ok) {
              throw existingResponse.error;
            }

            if (!existingResponse.data) {
              throw ErrorHandler.createNotFoundError(
                'TimeEntry',
                input.timeEntryId,
                {
                  businessId: input.businessId,
                }
              );
            }

            const existingEntry = existingResponse.data;

            // Build full update data object by merging existing with provided fields
            const updateData: any = { ...existingEntry };

            if (input.duration !== undefined) {
              updateData.duration = input.duration;
            }
            if (input.isLogged !== undefined) {
              updateData.isLogged = input.isLogged;
            }
            if (input.startedAt !== undefined) {
              updateData.startedAt = new Date(input.startedAt);
            }
            if (input.note !== undefined) {
              updateData.note = input.note;
            }
            if (input.projectId !== undefined) {
              updateData.projectId = input.projectId;
            }
            if (input.clientId !== undefined) {
              updateData.clientId = input.clientId;
            }
            if (input.serviceId !== undefined) {
              updateData.serviceId = input.serviceId;
            }
            if (input.taskId !== undefined) {
              updateData.taskId = input.taskId;
            }
            if (input.billable !== undefined) {
              updateData.billable = input.billable;
            }
            if (input.active !== undefined) {
              updateData.active = input.active;
            }
            if (input.internal !== undefined) {
              updateData.internal = input.internal;
            }
            if (input.retainerId !== undefined) {
              updateData.retainerId = input.retainerId;
            }

            // Validate that at least one field is being updated
            const updatedFields = Object.keys(input).filter(
              (k) => k !== 'businessId' && k !== 'timeEntryId' && input[k as keyof typeof input] !== undefined
            );
            if (updatedFields.length === 0) {
              throw ErrorHandler.createValidationError(
                'No fields provided to update. Please specify at least one field to change.'
              );
            }

            logger.debug('Update data being sent to FreshBooks API', {
              updateData,
              businessId: input.businessId,
              timeEntryId: input.timeEntryId,
              updatedFields,
            });

            const response = await fbClient.timeEntries.update(
              updateData,
              input.businessId,
              input.timeEntryId
            );

            logger.debug('FreshBooks API response', {
              ok: response.ok,
              error: response.error,
              data: response.data,
            });

            if (!response.ok) {
              throw response.error;
            }

            if (!response.data) {
              throw ErrorHandler.createNotFoundError(
                'TimeEntry',
                input.timeEntryId,
                {
                  businessId: input.businessId,
                }
              );
            }

            return response.data;
          }
        );

        logger.info('Time entry updated successfully', {
          timeEntryId: input.timeEntryId,
          updatedFields: Object.keys(input).filter(
            (k) => k !== 'businessId' && k !== 'timeEntryId' && input[k as keyof typeof input] !== undefined
          ),
        });

        return result as any;
      }
    );

    return handler(input, { businessId: input.businessId, entityId: input.timeEntryId }) as any;
  },
};
