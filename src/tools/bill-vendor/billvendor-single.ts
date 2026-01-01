/**
 * BillVendor Single Tool
 *
 * Retrieve a single vendor by ID.
 */

import { z } from "zod";
import { BillVendorSingleInputSchema, BillVendorSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for billvendor_single
 */
export const billvendorSingleTool = {
  name: "billvendor_single",
  description: `Retrieve a single vendor by ID from FreshBooks.

WHEN TO USE:
- User asks for details about a specific vendor
- User references a vendor ID or name
- User wants to see full vendor information before creating a bill

REQUIRED:
- accountId: FreshBooks account ID
- vendorId: The specific vendor ID to retrieve

EXAMPLE PROMPTS:
- "Show me vendor 12345"
- "Get details for that supplier"
- "What's the contact info for vendor #V-001?"

RETURNS:
Complete vendor details including name, contact info, address, tax information,
and any notes.`,

  inputSchema: BillVendorSingleInputSchema,
  outputSchema: BillVendorSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillVendorSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillVendorSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'billvendor_single',
      async (
        input: z.infer<typeof BillVendorSingleInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, vendorId } = input;

        logger.debug('Retrieving vendor', {
          accountId,
          vendorId,
        });

        const result = await client.executeWithRetry(
          'billvendor_single',
          async (fbClient) => {
            const response = await fbClient.billVendors.single(accountId, vendorId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { bill_vendor: { ... } }
        const vendor = (result as { bill_vendor?: unknown }).bill_vendor ?? result;

        logger.info('Vendor retrieved successfully', {
          vendorId,
        });

        return vendor as z.infer<typeof BillVendorSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
