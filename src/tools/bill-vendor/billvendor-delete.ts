/**
 * BillVendor Delete Tool
 *
 * Delete a vendor from FreshBooks.
 */

import { z } from "zod";
import { BillVendorDeleteInputSchema, BillVendorDeleteOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for billvendor_delete
 */
export const billvendorDeleteTool = {
  name: "billvendor_delete",
  description: `Delete a vendor from FreshBooks.

WHEN TO USE:
- User asks to "delete a vendor", "remove a supplier"
- Vendor was created by mistake
- Vendor is no longer used and should be removed

REQUIRED:
- accountId: FreshBooks account ID
- vendorId: The vendor ID to delete

IMPORTANT:
- Cannot delete vendors that have associated bills
- Deletion is permanent and cannot be undone
- Consider archiving instead if vendor has bill history

EXAMPLE PROMPTS:
- "Delete vendor 12345"
- "Remove that supplier I just added"
- "Delete the duplicate vendor"

RETURNS:
Confirmation of successful deletion with the vendor ID.`,

  inputSchema: BillVendorDeleteInputSchema,
  outputSchema: BillVendorDeleteOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillVendorDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillVendorDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'billvendor_delete',
      async (
        input: z.infer<typeof BillVendorDeleteInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, vendorId } = input;

        logger.debug('Deleting vendor', {
          accountId,
          vendorId,
        });

        await client.executeWithRetry(
          'billvendor_delete',
          async (fbClient) => {
            const response = await fbClient.billVendors.delete(accountId, vendorId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        logger.info('Vendor deleted successfully', {
          vendorId,
        });

        return {
          success: true,
          vendorId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
