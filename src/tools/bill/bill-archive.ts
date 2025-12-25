/**
 * Bill Archive Tool
 *
 * Archive a bill in FreshBooks (soft delete).
 */

import { z } from "zod";
import { BillArchiveInputSchema, BillArchiveOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for bill_archive
 */
export const billArchiveTool = {
  name: "bill_archive",
  description: `Archive a bill in FreshBooks (soft delete, preserves records).

WHEN TO USE:
- User wants to hide a bill without deleting it permanently
- Bill is paid and should be removed from active lists
- User wants to clean up bill list while preserving history

REQUIRED:
- accountId: FreshBooks account ID
- billId: The bill ID to archive

BENEFITS OVER DELETE:
- Archived bills can be restored if needed
- Preserves historical records and audit trail
- Safer option for bills with payment history

EXAMPLE PROMPTS:
- "Archive bill 12345"
- "Hide that paid bill from my list"
- "Archive the old vendor bills"

RETURNS:
Confirmation of successful archiving with the bill ID.`,

  inputSchema: BillArchiveInputSchema,
  outputSchema: BillArchiveOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillArchiveInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillArchiveOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'bill_archive',
      async (
        input: z.infer<typeof BillArchiveInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, billId } = input;

        logger.debug('Archiving bill', {
          accountId,
          billId,
        });

        await client.executeWithRetry(
          'bill_archive',
          async (fbClient) => {
            // Archive is implemented as an update to set visState to archived (2)
            const response = await fbClient.bills.archive(accountId, billId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        logger.info('Bill archived successfully', {
          billId,
        });

        return {
          success: true,
          billId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
