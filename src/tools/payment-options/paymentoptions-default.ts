/**
 * PaymentOptions Default Tool
 *
 * Get default payment options for the account.
 */

import { z } from "zod";
import { PaymentOptionsDefaultInputSchema, PaymentOptionsDefaultOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for paymentoptions_default
 */
export const paymentOptionsDefaultTool = {
  name: "paymentoptions_default",
  description: `Get default payment options for the account.

WHEN TO USE:
- User wants to see account-level payment settings
- User asks "what payment methods are enabled by default"
- Need to check default gateway configuration
- Planning to create invoices and need default payment setup

REQUIRED INFO:
- Account ID only

WHAT IT RETURNS:
Default payment configuration that applies to new invoices/estimates:
- Default payment gateway
- Whether credit cards are enabled by default
- Whether ACH is enabled by default
- Whether PayPal is enabled by default
- Whether partial payments are allowed by default

USE CASES:
- Checking account payment configuration
- Understanding what settings new invoices will inherit
- Verifying payment gateway setup
- Troubleshooting payment issues

EXAMPLE PROMPTS:
- "What are my default payment options?"
- "Show account payment settings"
- "What payment gateway am I using?"
- "Are credit cards enabled by default?"

RETURNS:
Default payment options configuration for the account.`,

  inputSchema: PaymentOptionsDefaultInputSchema,
  outputSchema: PaymentOptionsDefaultOutputSchema,

  async execute(
    input: z.infer<typeof PaymentOptionsDefaultInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof PaymentOptionsDefaultOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'paymentoptions_default',
      async (input: z.infer<typeof PaymentOptionsDefaultInputSchema>, _context: ToolContext) => {
        const { accountId } = input;

        const result = await client.executeWithRetry('paymentoptions_default', async (fbClient) => {
          const response = await fbClient.paymentOptions.default(accountId);

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
