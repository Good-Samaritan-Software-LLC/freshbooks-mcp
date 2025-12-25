/**
 * Bill Delete Tool
 *
 * Delete a bill from FreshBooks.
 */

import { z } from "zod";
import { BillDeleteInputSchema, BillDeleteOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for bill_delete
 */
export const billDeleteTool = {
  name: "bill_delete",
  description: `Delete a bill from FreshBooks.

WHEN TO USE:
- User asks to "delete a bill", "remove a bill"
- User entered a bill by mistake
- Bill is no longer needed and should be removed

REQUIRED:
- accountId: FreshBooks account ID
- billId: The bill ID to delete

IMPORTANT:
- Deletion is permanent and cannot be undone
- Consider using bill_archive instead to preserve records
- Cannot delete bills that have payments against them

EXAMPLE PROMPTS:
- "Delete bill 12345"
- "Remove that bill I just created"
- "Delete the incorrect vendor bill"

RETURNS:
Confirmation of successful deletion with the bill ID.`,

  inputSchema: BillDeleteInputSchema,
  outputSchema: BillDeleteOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'bill_delete',
      async (
        input: z.infer<typeof BillDeleteInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, billId } = input;

        logger.debug('Deleting bill', {
          accountId,
          billId,
        });

        await client.executeWithRetry(
          'bill_delete',
          async (fbClient) => {
            const response = await fbClient.bills.delete(accountId, billId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        logger.info('Bill deleted successfully', {
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
