/**
 * Callback Verify Tool
 *
 * Verify ownership of a webhook endpoint.
 */

import { z } from "zod";
import { CallbackVerifyInputSchema, CallbackVerifyOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for callback_verify
 */
export const callbackVerifyTool = {
  name: "callback_verify",
  description: `Verify ownership of a webhook endpoint.

WHEN TO USE:
- After creating a new webhook (required to activate it)
- User received a verification code at their webhook endpoint
- User says "verify webhook", "activate callback"

REQUIRED INFO:
- Callback ID to verify
- Verification code (received as POST to your webhook URL)
- Account ID

HOW IT WORKS:
1. After creating a webhook, FreshBooks sends a POST to your URL with a verifier code
2. Extract the verifier from the request body
3. Call this tool with the callback ID and verifier code
4. Once verified, webhook becomes active and events start flowing

VERIFICATION REQUEST FORMAT:
FreshBooks POSTs to your webhook URL:
{
  "object": "callback",
  "action": "verify",
  "verifier": "abc123xyz..."
}

EXAMPLE PROMPTS:
- "Verify webhook 123 with code abc123xyz"
- "Activate callback 456 using verifier def456"
- "Complete webhook verification"

RETURNS:
Verification status and updated webhook configuration.`,

  inputSchema: CallbackVerifyInputSchema,
  outputSchema: CallbackVerifyOutputSchema,

  async execute(
    input: z.infer<typeof CallbackVerifyInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CallbackVerifyOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'callback_verify',
      async (input: z.infer<typeof CallbackVerifyInputSchema>, _context: ToolContext) => {
        const { accountId, callbackId, verifier } = input;

        const result = await client.executeWithRetry('callback_verify', async (fbClient) => {
          const response = await fbClient.callbacks.verify(accountId, String(callbackId), verifier);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Extract callback data
        const callback = (result as any).callback;

        return {
          success: true,
          verified: callback.verified,
          callbackId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
