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
- issueDate: When the bill was issued (ISO 8601 format)
- amount: Bill amount with currency code

OPTIONAL BUT HELPFUL:
- dueDate: When payment is due
- billNumber: Vendor's bill/invoice number
- lines: Itemized line items
- notes: Additional notes or descriptions
- attachment: Scanned bill or PDF

EXAMPLE PROMPTS:
- "Create a bill for vendor 123 for $500"
- "Record a new bill from my supplier dated today"
- "Add vendor bill #INV-2024-001 for $1,250"

RETURNS:
Created bill with ID, status, and all details for tracking and payment.`,

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
      async (
        input: z.infer<typeof BillCreateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, ...billData } = input;

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
