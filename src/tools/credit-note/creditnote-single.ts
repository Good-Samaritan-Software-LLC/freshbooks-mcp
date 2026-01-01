/**
 * CreditNote Single Tool
 *
 * Retrieve a single credit note by ID.
 */

import { z } from "zod";
import { CreditNoteSingleInputSchema, CreditNoteSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for creditnote_single
 */
export const creditnoteSingleTool = {
  name: "creditnote_single",
  description: `Retrieve a single credit note by ID from FreshBooks.

WHEN TO USE:
- User asks for details about a specific credit note
- User provides a credit note ID or number
- User needs to review credit note details before applying or updating

REQUIRED INFO:
- creditNoteId: The credit note identifier
- accountId: FreshBooks account (get from context)

EXAMPLE PROMPTS:
- "Show me credit note #12345"
- "Get details for credit note 67890"
- "What's in credit note ID 555?"

RETURNS:
Complete credit note record including credit amount, client info, status,
line items, and all other credit note properties.`,

  inputSchema: CreditNoteSingleInputSchema,
  outputSchema: CreditNoteSingleOutputSchema,

  async execute(
    input: z.infer<typeof CreditNoteSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CreditNoteSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'creditnote_single',
      async (input: z.infer<typeof CreditNoteSingleInputSchema>, _context: ToolContext) => {
        const { accountId, creditNoteId } = input;

        const result = await client.executeWithRetry('creditnote_single', async (fbClient) => {
          // WORKAROUND: SDK has a bug in creditNotes.single() - it extracts 'credit_notes' (plural)
          // from the response when the API returns 'credit_note' (singular).
          // Use list with search filter instead.
          const { SearchQueryBuilder } = await import(
            '@freshbooks/api/dist/models/builders/index.js'
          );

          const search = new SearchQueryBuilder();
          search.equals('creditid', creditNoteId);

          const response = await fbClient.creditNotes.list(accountId, [search]);

          if (!response.ok) {
            throw response.error;
          }

          const data = response.data as { creditNotes?: unknown[]; credit_notes?: unknown[] };
          const creditNotes = data.creditNotes || data.credit_notes || [];

          if (creditNotes.length === 0) {
            throw new Error(`Credit note ${creditNoteId} not found`);
          }

          return creditNotes[0];
        });

        return result as z.infer<typeof CreditNoteSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
