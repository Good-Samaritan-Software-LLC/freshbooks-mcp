/**
 * CreditNote Create Tool
 *
 * Create a new credit note in FreshBooks.
 */

import { z } from "zod";
import { CreditNoteCreateInputSchema, CreditNoteSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for creditnote_create
 */
export const creditnoteCreateTool = {
  name: "creditnote_create",
  description: `Create a new credit note in FreshBooks.

WHEN TO USE:
- User needs to issue a refund or credit to a client
- User says "create credit note", "issue credit", "refund client"
- User wants to adjust billing for returned goods/services

REQUIRED INFO:
- clientId: Client receiving the credit (required)
- createDate: Credit note date (ISO 8601 format)
- lines: At least one line item with name and amount
- accountId: FreshBooks account (get from context)

OPTIONAL BUT HELPFUL:
- notes: Internal notes about why credit is issued
- terms: Terms and conditions
- currencyCode: Currency (defaults to USD)
- language: Language code for the credit note

LINE ITEMS:
Each line needs:
- name: Description of what's being credited
- amount: Credit amount with currency code
- Optional: quantity, unitCost, description

EXAMPLE PROMPTS:
- "Create a credit note for client 12345 for $100 refund"
- "Issue a credit to client ABC for returned product, $250"
- "Create credit note dated Jan 15: refund of overpayment, $50"

RETURNS:
Created credit note with ID, number, status, and line items.
Credit can then be applied to future invoices or refunded.`,

  inputSchema: CreditNoteCreateInputSchema,
  outputSchema: CreditNoteSingleOutputSchema,

  async execute(
    input: z.infer<typeof CreditNoteCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CreditNoteSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'creditnote_create',
      async (input: z.infer<typeof CreditNoteCreateInputSchema>, _context: ToolContext) => {
        const { accountId, ...creditNoteData } = input;

        // Build credit note object using camelCase properties
        // The FreshBooks SDK's transformCreditNoteRequest() will convert to API format
        const creditNote: Record<string, unknown> = {
          clientId: creditNoteData.clientId,
          createDate: creditNoteData.createDate,
          currencyCode: creditNoteData.currencyCode || 'USD',
          lines: creditNoteData.lines.map(line => ({
            name: line.name,
            description: line.description,
            qty: line.quantity || 1,
            unitCost: line.unitCost,
            amount: line.amount,
          })),
        };

        // Add optional fields if provided
        if (creditNoteData.notes !== undefined) creditNote.notes = creditNoteData.notes;
        if (creditNoteData.terms !== undefined) creditNote.terms = creditNoteData.terms;
        if (creditNoteData.language !== undefined) creditNote.language = creditNoteData.language;

        const result = await client.executeWithRetry('creditnote_create', async (fbClient) => {
          const response = await fbClient.creditNotes.create(creditNote as any, accountId);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // FreshBooks returns: { credit_note: { ... } }
        const createdCreditNote = (result as { credit_note?: unknown; creditNote?: unknown }).credit_note
          ?? (result as { credit_note?: unknown; creditNote?: unknown }).creditNote
          ?? result;

        return createdCreditNote as z.infer<typeof CreditNoteSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
