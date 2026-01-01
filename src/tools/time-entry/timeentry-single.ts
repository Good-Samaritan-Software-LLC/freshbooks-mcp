/**
 * timeentry_single Tool
 *
 * Retrieve a single time entry by ID from FreshBooks.
 */

import { z } from 'zod';
import { TimeEntrySingleInputSchema, TimeEntrySingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for timeentry_single
 */
export const timeentrySingleTool = {
  name: 'timeentry_single',
  description: `Get a single time entry by ID from FreshBooks.

WHEN TO USE:
- User wants to see details of a specific time entry
- User references a time entry ID and wants full information
- User asks "show time entry 123", "get details for entry X"
- Need to retrieve a time entry before updating or deleting it

REQUIRED:
- businessId: FreshBooks business ID (get from user_me -> businessMemberships[].business.id)
- timeEntryId: The ID of the time entry to retrieve

RETURNS:
Complete time entry object with:
- id: Time entry ID
- duration: Time in seconds
- note: Description of work
- startedAt: When the entry began
- createdAt: When the entry was created
- projectId, clientId, taskId, serviceId: Associated entities
- billable, billed: Billing status
- active: Whether timer is currently running
- timer: Active timer object if running
- All other time entry fields

EXAMPLES:
- "Show me time entry 456"
- "Get details for time entry ID 789"
- "What's in time entry 123?"`,

  inputSchema: TimeEntrySingleInputSchema,
  outputSchema: TimeEntrySingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof TimeEntrySingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimeEntrySingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timeentry_single',
      async (
        input: z.infer<typeof TimeEntrySingleInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Retrieving time entry', {
          businessId: input.businessId,
          timeEntryId: input.timeEntryId,
        });

        const result = await client.executeWithRetry(
          'timeentry_single',
          async (fbClient) => {
            const response = await fbClient.timeEntries.single(
              input.businessId,
              input.timeEntryId
            );

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

        logger.info('Time entry retrieved successfully', {
          timeEntryId: input.timeEntryId,
          duration: result.duration,
        });

        return result as any;
      }
    );

    return handler(input, { businessId: input.businessId, entityId: input.timeEntryId }) as any;
  },
};
