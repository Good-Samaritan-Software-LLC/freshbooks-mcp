/**
 * BillPayment Delete Tool
 *
 * Delete a bill payment from FreshBooks.
 */

import { z } from "zod";
import { BillPaymentDeleteInputSchema, BillPaymentDeleteOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for billpayment_delete
 */
export const billpaymentDeleteTool = {
  name: "billpayment_delete",
  description: `Delete a bill payment from FreshBooks.

WHEN TO USE:
- User asks to "delete a payment", "remove a bill payment"
- Payment was recorded in error
- Payment needs to be removed and re-entered

REQUIRED:
- accountId: FreshBooks account ID
- billPaymentId: The payment ID to delete

IMPORTANT:
- Deletion is permanent and cannot be undone
- Deleting a payment will affect the bill's outstanding amount
- Ensure this is the correct payment before deleting

EXAMPLE PROMPTS:
- "Delete payment 12345"
- "Remove that bill payment I just created"
- "Delete the incorrect vendor payment"

RETURNS:
Confirmation of successful deletion with the payment ID.`,

  inputSchema: BillPaymentDeleteInputSchema,
  outputSchema: BillPaymentDeleteOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillPaymentDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillPaymentDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'billpayment_delete',
      async (
        input: z.infer<typeof BillPaymentDeleteInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, billPaymentId } = input;

        logger.debug('Deleting bill payment', {
          accountId,
          billPaymentId,
        });

        await client.executeWithRetry(
          'billpayment_delete',
          async (fbClient) => {
            const response = await fbClient.billPayments.delete(accountId, billPaymentId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        logger.info('Bill payment deleted successfully', {
          billPaymentId,
        });

        return {
          success: true,
          billPaymentId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
