/**
 * User Me Tool
 *
 * Get information about the currently authenticated user.
 */

import { z } from "zod";
import { UserMeInputSchema, UserMeOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for user_me
 */
export const userMeTool = {
  name: "user_me",
  description: `Get information about the currently authenticated user.

WHEN TO USE:
- User asks "who am I", "what's my account info", "show my profile"
- Need to get the user's business memberships and account IDs
- Need to verify authentication is working
- Need to get user's email or name

WHAT IT RETURNS:
Complete user profile including:
- User ID, email, name
- Business memberships with account IDs and roles
- Phone numbers and addresses
- Professional information

IMPORTANT:
This uses the current OAuth access token to identify the user.
No parameters needed - automatically gets the authenticated user.

USE CASES:
- Finding account IDs for other API calls
- Verifying which businesses the user has access to
- Getting user details for personalization
- Checking user roles and permissions

EXAMPLE PROMPTS:
- "Who am I logged in as?"
- "What businesses do I have access to?"
- "Show me my FreshBooks profile"
- "What's my account ID?"

RETURNS:
User profile with business memberships and account information.`,

  inputSchema: UserMeInputSchema,
  outputSchema: UserMeOutputSchema,

  async execute(
    input: z.infer<typeof UserMeInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof UserMeOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'user_me',
      async (_input: z.infer<typeof UserMeInputSchema>, _context: ToolContext) => {
        const result = await client.executeWithRetry('user_me', async (fbClient) => {
          const response = await fbClient.users.me();

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Return user data
        return result as any;
      }
    );

    return handler(input, { accountId: '' }); // No accountId needed for this endpoint
  },
};
