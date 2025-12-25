/**
 * CreditNote Delete Tool
 *
 * Delete a credit note from FreshBooks.
 */

import { z } from "zod";
import { CreditNoteDeleteInputSchema, CreditNoteDeleteOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for creditnote_delete
 */
export const creditnoteDeleteTool = {
  name: "creditnote_delete",
  description: `Delete a credit note from FreshBooks.

WHEN TO USE:
- User created credit note in error
- User says "delete credit note", "remove credit note", "cancel credit"
- User needs to void a credit note

REQUIRED INFO:
- creditNoteId: Credit note to delete
- accountId: FreshBooks account (get from context)

IMPORTANT NOTES:
- Can only delete credit notes that haven't been applied
- This cannot be undone - use with caution
- Applied credits should be voided instead of deleted
- Consider updating instead of deleting if just correcting details

EXAMPLE PROMPTS:
- "Delete credit note #12345"
- "Remove credit note 67890 - it was created by mistake"
- "Cancel credit note ID 555"

RETURNS:
Confirmation of deletion with the deleted credit note ID.`,

  inputSchema: CreditNoteDeleteInputSchema,
  outputSchema: CreditNoteDeleteOutputSchema,

  async execute(
    input: z.infer<typeof CreditNoteDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CreditNoteDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'creditnote_delete',
      async (input: z.infer<typeof CreditNoteDeleteInputSchema>, _context: ToolContext) => {
        const { accountId, creditNoteId } = input;

        await client.executeWithRetry('creditnote_delete', async (fbClient) => {
          const response = await fbClient.creditNotes.delete(accountId, String(creditNoteId));

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return {
          success: true,
          creditNoteId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
