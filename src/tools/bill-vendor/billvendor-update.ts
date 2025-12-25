/**
 * BillVendor Update Tool
 *
 * Update an existing vendor in FreshBooks.
 */

import { z } from "zod";
import { BillVendorUpdateInputSchema, BillVendorSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for billvendor_update
 */
export const billvendorUpdateTool = {
  name: "billvendor_update",
  description: `Update an existing vendor in FreshBooks.

WHEN TO USE:
- User wants to update vendor contact information
- Vendor address or details have changed
- User needs to correct vendor information

REQUIRED:
- accountId: FreshBooks account ID
- vendorId: The vendor ID to update

OPTIONAL (at least one should be provided):
- vendorName: Updated vendor name
- contactName: Updated contact person
- email: Updated email address
- phone: Updated phone number
- address, city, province, postalCode, country: Updated address
- accountNumber: Updated account number
- taxNumber: Updated tax ID
- note: Updated notes
- is1099: Updated 1099 status

EXAMPLE PROMPTS:
- "Update vendor 123's email to newemail@vendor.com"
- "Change the contact name for vendor 'Acme Supplies'"
- "Update vendor address for supplier 456"

RETURNS:
Updated vendor with all current details.`,

  inputSchema: BillVendorUpdateInputSchema,
  outputSchema: BillVendorSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillVendorUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillVendorSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'billvendor_update',
      async (
        input: z.infer<typeof BillVendorUpdateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, vendorId, ...updateData } = input;

        logger.debug('Updating vendor', {
          accountId,
          vendorId,
        });

        const result = await client.executeWithRetry(
          'billvendor_update',
          async (fbClient) => {
            const response = await fbClient.billVendors.update(updateData as any, accountId, vendorId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { bill_vendor: { ... } }
        const updatedVendor = (result as { bill_vendor?: unknown }).bill_vendor ?? result;

        logger.info('Vendor updated successfully', {
          vendorId,
        });

        return updatedVendor as z.infer<typeof BillVendorSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
