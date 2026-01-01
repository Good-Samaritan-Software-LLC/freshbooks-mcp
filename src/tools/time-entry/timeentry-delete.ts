/**
 * timeentry_delete Tool
 *
 * Delete a time entry from FreshBooks.
 */

import { z } from 'zod';
import { TimeEntryDeleteInputSchema, TimeEntryDeleteOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for timeentry_delete
 */
export const timeentryDeleteTool = {
  name: 'timeentry_delete',
  description: `Delete a time entry from FreshBooks.

WHEN TO USE:
- User wants to remove a time entry completely
- User says "delete time entry X", "remove entry Y", "discard this time log"
- User made a mistake and wants to delete rather than update
- User wants to discard a running timer without logging the time
- User asks "delete entry 123", "remove that time entry"

REQUIRED:
- businessId: FreshBooks business ID (get from user_me -> businessMemberships[].business.id)
- timeEntryId: ID of the time entry to delete

IMPORTANT NOTES:
- Deletion is permanent and cannot be undone
- Use this to discard running timers without logging time
- If time was already billed, deletion may affect invoices
- Consider updating instead of deleting if you just need to change values

USE CASES:
1. Discard a running timer:
   - Delete the active time entry to discard without logging

2. Remove erroneous entry:
   - Delete time entries created by mistake

3. Clean up test data:
   - Remove test or sample time entries

ALTERNATIVE ACTIONS:
- To change duration/project: Use timeentry_update instead
- To make non-billable: Use timeentry_update with billable=false
- To archive: FreshBooks doesn't support archiving (delete removes completely)

RETURNS:
Success confirmation with:
- success: true/false
- message: Confirmation message
- timeEntryId: ID of the deleted entry

EXAMPLES:
User says: "Delete time entry 123"
→ timeEntryId: 123

User says: "Discard timer 456"
→ timeEntryId: 456

User says: "Remove that time entry I just created"
→ (first get the time entry ID, then delete)`,

  inputSchema: TimeEntryDeleteInputSchema,
  outputSchema: TimeEntryDeleteOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof TimeEntryDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimeEntryDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timeentry_delete',
      async (
        input: z.infer<typeof TimeEntryDeleteInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Deleting time entry', {
          businessId: input.businessId,
          timeEntryId: input.timeEntryId,
        });

        await client.executeWithRetry('timeentry_delete', async (fbClient) => {
          const response = await fbClient.timeEntries.delete(
            input.businessId,
            input.timeEntryId
          );

          if (!response.ok) {
            throw response.error;
          }

          return response;
        });

        logger.info('Time entry deleted successfully', {
          timeEntryId: input.timeEntryId,
        });

        return {
          success: true,
          message: `Time entry ${input.timeEntryId} deleted successfully`,
          timeEntryId: input.timeEntryId,
        };
      }
    );

    return handler(input, { businessId: input.businessId, entityId: input.timeEntryId });
  },
};
