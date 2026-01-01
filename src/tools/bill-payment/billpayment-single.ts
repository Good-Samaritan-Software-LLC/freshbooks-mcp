/**
 * BillPayment Single Tool
 *
 * Retrieve a single bill payment by ID.
 */

import { z } from "zod";
import { BillPaymentSingleInputSchema, BillPaymentSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for billpayment_single
 */
export const billpaymentSingleTool = {
  name: "billpayment_single",
  description: `Retrieve a single bill payment by ID from FreshBooks.

WHEN TO USE:
- User asks for details about a specific payment
- User references a payment ID
- User wants to see full payment information

REQUIRED:
- accountId: FreshBooks account ID
- billPaymentId: The specific payment ID to retrieve

EXAMPLE PROMPTS:
- "Show me payment 12345"
- "Get details for that bill payment"
- "What was payment #BP-001?"

RETURNS:
Complete payment details including amount, date, payment type, associated bill,
and any notes.`,

  inputSchema: BillPaymentSingleInputSchema,
  outputSchema: BillPaymentSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillPaymentSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillPaymentSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'billpayment_single',
      async (
        input: z.infer<typeof BillPaymentSingleInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, billPaymentId } = input;

        logger.debug('Retrieving bill payment', {
          accountId,
          billPaymentId,
        });

        const result = await client.executeWithRetry(
          'billpayment_single',
          async (fbClient) => {
            const response = await fbClient.billPayments.single(accountId, billPaymentId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { bill_payment: { ... } }
        const billPayment = (result as { bill_payment?: unknown }).bill_payment ?? result;

        logger.info('Bill payment retrieved successfully', {
          billPaymentId,
        });

        return billPayment as z.infer<typeof BillPaymentSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
