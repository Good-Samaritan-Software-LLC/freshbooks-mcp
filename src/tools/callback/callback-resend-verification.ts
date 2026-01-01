/**
 * Callback Resend Verification Tool
 *
 * Resend the verification request to a webhook endpoint.
 */

import { z } from "zod";
import { CallbackResendVerificationInputSchema, CallbackSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for callback_resend_verification
 */
export const callbackResendVerificationTool = {
  name: "callback_resend_verification",
  description: `Resend the verification request to a webhook endpoint.

WHEN TO USE:
- User didn't receive the initial verification code
- Verification code expired or was lost
- User says "resend webhook verification", "send verification again"
- Webhook endpoint was temporarily down during initial verification

REQUIRED INFO:
- Callback ID to resend verification for
- Account ID

WHAT HAPPENS:
- FreshBooks sends a new POST request to the webhook URL
- Request contains a fresh verifier code
- User can then use callback_verify with the new code

VERIFICATION REQUEST FORMAT:
FreshBooks will POST to the webhook URL:
{
  "object": "callback",
  "action": "verify",
  "verifier": "new_abc123xyz..."
}

EXAMPLE PROMPTS:
- "Resend verification for webhook 123"
- "Send webhook verification again"
- "I didn't get the verification code, send it again"

RETURNS:
Updated webhook configuration (still unverified until callback_verify is called).`,

  inputSchema: CallbackResendVerificationInputSchema,
  outputSchema: CallbackSingleOutputSchema,

  async execute(
    input: z.infer<typeof CallbackResendVerificationInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CallbackSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'callback_resend_verification',
      async (input: z.infer<typeof CallbackResendVerificationInputSchema>, _context: ToolContext) => {
        const { accountId, callbackId } = input;

        const result = await client.executeWithRetry('callback_resend_verification', async (fbClient) => {
          const response = await fbClient.callbacks.resendVerification(accountId, String(callbackId));

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Extract callback data
        return (result as any).callback;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
