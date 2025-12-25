/**
 * Bill Single Tool
 *
 * Retrieve a single bill by ID.
 */

import { z } from "zod";
import { BillSingleInputSchema, BillSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for bill_single
 */
export const billSingleTool = {
  name: "bill_single",
  description: `Retrieve a single bill by ID from FreshBooks.

WHEN TO USE:
- User asks for details about a specific bill
- User references a bill number or ID
- User wants to see full bill information including line items

REQUIRED:
- accountId: FreshBooks account ID
- billId: The specific bill ID to retrieve

EXAMPLE PROMPTS:
- "Show me bill 12345"
- "Get details for that vendor bill"
- "What's in bill #B-0042?"

RETURNS:
Complete bill details including vendor info, line items, amounts, due date,
payment status, and any attached documents.`,

  inputSchema: BillSingleInputSchema,
  outputSchema: BillSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'bill_single',
      async (
        input: z.infer<typeof BillSingleInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, billId } = input;

        logger.debug('Retrieving bill', {
          accountId,
          billId,
        });

        const result = await client.executeWithRetry(
          'bill_single',
          async (fbClient) => {
            const response = await fbClient.bills.single(accountId, billId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { bill: { ... } }
        const bill = (result as { bill?: unknown }).bill ?? result;

        logger.info('Bill retrieved successfully', {
          billId,
        });

        return bill as z.infer<typeof BillSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
