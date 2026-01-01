/**
 * BillVendor Create Tool
 *
 * Create a new vendor in FreshBooks.
 */

import { z } from "zod";
import { BillVendorCreateInputSchema, BillVendorSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for billvendor_create
 */
export const billvendorCreateTool = {
  name: "billvendor_create",
  description: `Create a new vendor in FreshBooks for bill tracking.

WHEN TO USE:
- User says "add a vendor", "create a supplier", "new vendor"
- User needs to add a new vendor before creating bills
- User mentions a new supplier they work with

REQUIRED INFO:
- accountId: FreshBooks account ID
- vendorName: The vendor/supplier name

OPTIONAL BUT HELPFUL:
- contactName: Primary contact person
- email: Vendor email address
- phone: Vendor phone number
- address, city, province, postalCode, country: Full address
- currencyCode: Currency for transactions (defaults to USD)
- accountNumber: Your account number with the vendor
- taxNumber: Vendor's tax ID/VAT number
- note: Additional notes about the vendor
- is1099: Whether vendor is 1099 eligible (US tax purposes)

EXAMPLE PROMPTS:
- "Add a new vendor called Acme Supplies"
- "Create vendor 'Office Depot' with email supplies@officedepot.com"
- "Add supplier 'Tech Parts Inc' in Canada"

RETURNS:
Created vendor with ID and all details for future bill creation.`,

  inputSchema: BillVendorCreateInputSchema,
  outputSchema: BillVendorSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillVendorCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillVendorSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'billvendor_create',
      async (
        input: z.infer<typeof BillVendorCreateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, ...vendorData } = input;

        logger.debug('Creating vendor', {
          accountId,
          vendorName: vendorData.vendorName,
        });

        const result = await client.executeWithRetry(
          'billvendor_create',
          async (fbClient) => {
            const response = await fbClient.billVendors.create(vendorData as any, accountId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { bill_vendor: { ... } }
        const createdVendor = (result as { bill_vendor?: unknown }).bill_vendor ?? result;

        logger.info('Vendor created successfully', {
          vendorId: (createdVendor as { id?: number }).id,
        });

        return createdVendor as z.infer<typeof BillVendorSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
