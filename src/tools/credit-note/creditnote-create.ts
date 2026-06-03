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
- createDate: Credit note date (YYYY-MM-DD, e.g., 2024-12-21)
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
      CreditNoteCreateInputSchema,
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

        // The SDK's creditNotes.create wraps the body in the PLURAL `credit_notes`
        // key, which the create endpoint rejects ("'clientid' is a required
        // field"). The API wants the SINGULAR `credit_note` wrapper
        // (live-verified), so build the wire payload and POST it directly.
        const body = {
          credit_note: {
            clientid: creditNote.clientId,
            create_date: creditNote.createDate,
            currency_code: creditNote.currencyCode,
            lines: (creditNote.lines as Array<Record<string, unknown>>).map((l) => ({
              name: l.name,
              description: l.description,
              qty: l.qty,
              unit_cost: l.unitCost,
              amount: l.amount,
            })),
            ...(creditNote.notes !== undefined ? { notes: creditNote.notes } : {}),
            ...(creditNote.terms !== undefined ? { terms: creditNote.terms } : {}),
            ...(creditNote.language !== undefined ? { language: creditNote.language } : {}),
          },
        };

        const result = await client.executeRawWithRetry(
          'POST',
          `/accounting/account/${accountId}/credit_notes/credit_notes`,
          body,
          'creditnote_create'
        );

        if (!result.ok) {
          throw result.error ?? new Error('Credit note creation failed');
        }

        // Accounting API returns { response: { result: { credit_note: {...} } } }
        const createdCreditNote =
          (result.data as any)?.response?.result?.credit_note ?? result.data;

        return createdCreditNote as z.infer<typeof CreditNoteSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
