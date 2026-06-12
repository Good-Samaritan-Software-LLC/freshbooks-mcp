/**
 * Bill Create Tool
 *
 * Create a new bill in FreshBooks.
 */

import { z } from "zod";
import { BillCreateInputSchema, BillSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";
import { toLocalMidnightDate, daysBetween } from "../../utils/dates.js";

/**
 * Tool definition for bill_create
 */
export const billCreateTool = {
  name: "bill_create",
  description: `Create a new bill in FreshBooks for vendor payments.

WHEN TO USE:
- User says "create a bill", "add a vendor bill", "record a bill"
- User mentions receiving an invoice from a vendor
- User needs to track a vendor payment

REQUIRED INFO:
- accountId: FreshBooks account ID
- vendorId: The vendor this bill is from
- issueDate: When the bill was issued (YYYY-MM-DD, e.g., 2024-12-21)
- amount: Bill amount with currency code

OPTIONAL BUT HELPFUL:
- dueDate: When payment is due
- billNumber: Vendor's bill/invoice number
- lines: Itemized line items (put descriptive text in each line's description —
  the bill has no separate notes field; its summary is derived from the lines)
- attachment: Scanned bill or PDF

EXAMPLE PROMPTS:
- "Create a bill for vendor 123 for $500"
- "Record a new bill from my supplier dated today"
- "Add vendor bill #INV-2024-001 for $1,250"

RETURNS:
Created bill: id, billNumber, vendorId, status, amount: {amount, code},
outstandingAmount, issueDate, dueDate, lines[], taxAmount, createdAt, updatedAt.`,

  inputSchema: BillCreateInputSchema,
  outputSchema: BillSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'bill_create',
      BillCreateInputSchema,
      async (
        input: z.infer<typeof BillCreateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, ...billData } = input;

        // The bills API REQUIRES `due_offset_days` (the SDK maps it from
        // `dueOffsetDays`); without it the create fails "due_offset_days is a
        // required field" (#80). And `due_date` is READ-ONLY — it's computed by
        // FreshBooks from issue_date + due_offset_days, and writing it fails
        // "Write access denied ... field due_date". So: derive the offset from the
        // caller's dueDate (else default 0), then drop dueDate so it isn't sent.
        const bd = billData as Record<string, unknown>;
        if (bd.dueOffsetDays === undefined) {
          bd.dueOffsetDays =
            billData.dueDate !== undefined
              ? daysBetween(billData.issueDate, billData.dueDate as string)
              : 0;
        }
        delete bd.dueDate;

        // currency_code is also required by the bills API; default it (and
        // language) so the create doesn't fail on a missing required field (#80).
        bd.currencyCode = billData.currencyCode || 'USD';
        bd.language = billData.language || 'en';

        // Normalize the issue date to local midnight so the SDK's
        // transformDateRequest doesn't shift it back a day in negative-UTC
        // timezones (#76).
        if (billData.issueDate !== undefined) {
          bd.issueDate = toLocalMidnightDate(billData.issueDate);
        }

        logger.debug('Creating bill', {
          accountId,
          vendorId: billData.vendorId,
        });

        const result = await client.executeWithRetry(
          'bill_create',
          async (fbClient) => {
            const response = await fbClient.bills.create(billData as any, accountId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { bill: { ... } }
        const createdBill = (result as { bill?: unknown }).bill ?? result;

        logger.info('Bill created successfully', {
          billId: (createdBill as { id?: number }).id,
        });

        return createdBill as z.infer<typeof BillSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
