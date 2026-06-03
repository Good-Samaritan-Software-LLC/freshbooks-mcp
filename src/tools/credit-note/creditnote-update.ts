/**
 * CreditNote Update Tool
 *
 * Update an existing credit note in FreshBooks.
 */

import { z } from "zod";
import { CreditNoteUpdateInputSchema, CreditNoteSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for creditnote_update
 */
export const creditnoteUpdateTool = {
  name: "creditnote_update",
  description: `Update an existing credit note in FreshBooks.

WHEN TO USE:
- User needs to modify credit note details
- User says "update credit note", "fix credit note", "change credit amount"
- User wants to update line items, notes, or other details

REQUIRED INFO:
- creditNoteId: Credit note to update
- accountId: FreshBooks account (get from context)

UPDATABLE FIELDS:
- createDate: Adjust credit note date
- lines: Update line items (replaces all lines)
- notes: Update internal notes
- terms: Update terms and conditions

IMPORTANT NOTES:
- Can only update credit notes that haven't been applied or voided
- Updating lines replaces all existing line items
- Cannot change client after creation

EXAMPLE PROMPTS:
- "Update credit note #12345 to $150"
- "Change credit note 67890 date to January 15"
- "Fix line items on credit note 555"
- "Update credit note notes to explain refund reason"

RETURNS:
Updated credit note record with modified fields.`,

  inputSchema: CreditNoteUpdateInputSchema,
  outputSchema: CreditNoteSingleOutputSchema,

  async execute(
    input: z.infer<typeof CreditNoteUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CreditNoteSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'creditnote_update',
      CreditNoteUpdateInputSchema,
      async (input: z.infer<typeof CreditNoteUpdateInputSchema>, _context: ToolContext) => {
        const { accountId, creditNoteId, ...updates } = input;

        // The SDK's creditNotes.update wraps the body in the PLURAL `credit_notes`
        // key, which the API rejects (the failed response then trips a "reading
        // 'id' of undefined" unwrap — #81). The API wants the SINGULAR
        // `credit_note` wrapper, so build the wire payload and PUT it directly
        // (same as creditnote_create). createDate arrives already normalized to
        // `YYYY-MM-DDT00:00:00Z` by the input schema, sent raw (no SDK transform).
        const creditNote: Record<string, unknown> = {};
        if (updates.createDate !== undefined) creditNote.create_date = updates.createDate;
        if (updates.lines !== undefined) {
          creditNote.lines = updates.lines.map(line => ({
            name: line.name,
            description: line.description,
            qty: line.quantity || 1,
            unit_cost: line.unitCost,
            amount: line.amount,
          }));
        }
        if (updates.notes !== undefined) creditNote.notes = updates.notes;
        if (updates.terms !== undefined) creditNote.terms = updates.terms;

        const result = await client.executeRawWithRetry(
          'PUT',
          `/accounting/account/${accountId}/credit_notes/credit_notes/${creditNoteId}`,
          { credit_note: creditNote },
          'creditnote_update'
        );

        if (!result.ok) {
          throw result.error ?? new Error('Credit note update failed');
        }

        // Accounting API returns { response: { result: { credit_note: {...} } } }
        const updatedCreditNote =
          (result.data as any)?.response?.result?.credit_note ?? result.data;

        return updatedCreditNote as z.infer<typeof CreditNoteSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
