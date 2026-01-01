/**
 * PaymentOptions Single Tool
 *
 * Get payment options for a specific invoice or estimate.
 */

import { z } from "zod";
import { PaymentOptionsSingleInputSchema, PaymentOptionsSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for paymentoptions_single
 */
export const paymentOptionsSingleTool = {
  name: "paymentoptions_single",
  description: `Get payment options configured for a specific invoice or estimate.

WHEN TO USE:
- User wants to see what payment methods are available for an invoice
- User asks "how can this invoice be paid", "what payment options are enabled"
- Need to check payment gateway configuration for a specific entity

REQUIRED INFO:
- Entity ID (invoice or estimate ID)
- Entity type ("invoice" or "estimate")
- Account ID

WHAT IT RETURNS:
Payment configuration including:
- Whether credit card payments are enabled
- Whether ACH/bank transfer is enabled
- Whether PayPal Smart Checkout is enabled
- Whether partial payments are allowed
- Payment gateway information

EXAMPLE PROMPTS:
- "Show payment options for invoice 12345"
- "What payment methods are enabled for estimate 678?"
- "How can customers pay invoice 999?"

RETURNS:
Complete payment options configuration for the specified invoice or estimate.`,

  inputSchema: PaymentOptionsSingleInputSchema,
  outputSchema: PaymentOptionsSingleOutputSchema,

  async execute(
    input: z.infer<typeof PaymentOptionsSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof PaymentOptionsSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'paymentoptions_single',
      async (input: z.infer<typeof PaymentOptionsSingleInputSchema>, _context: ToolContext) => {
        const { accountId, entityId } = input;

        const result = await client.executeWithRetry('paymentoptions_single', async (fbClient) => {
          const response = await fbClient.paymentOptions.single(accountId, entityId.toString());

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Extract payment options data
        return (result as any).paymentOptions || (result as any);
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
