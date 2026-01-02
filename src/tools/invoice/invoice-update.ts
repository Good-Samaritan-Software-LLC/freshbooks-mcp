/**
 * invoice_update Tool
 *
 * Update an existing invoice in FreshBooks.
 */

import { z } from 'zod';
import { InvoiceUpdateInputSchema, InvoiceSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for invoice_update
 */
export const invoiceUpdateTool = {
  name: 'invoice_update',
  description: `Update an existing invoice in FreshBooks.

WHEN TO USE:
- User wants to modify invoice details
- User says "update invoice", "change invoice", "edit invoice"
- Correcting invoice amounts or line items
- Changing invoice status (mark as sent, etc.)
- Updating due date or payment terms

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- invoiceId: Invoice ID to update
- At least one field to update

UPDATABLE FIELDS:
- customerId: Change the client
- createDate: Invoice date (YYYY-MM-DD)
- dueDate: Payment due date (YYYY-MM-DD)
- currencyCode: Currency code
- lines: Replace line items (replaces ALL existing lines)
- notes: Invoice notes
- terms: Payment terms
- status: Invoice status (draft, sent, etc.)
- discount: Discount amount

PARTIAL UPDATES:
Only include fields you want to change. Omitted fields remain unchanged.
Note: Setting lines will REPLACE all existing line items.

RETURNS:
Updated invoice record with all current information.

EXAMPLES:
- "Update invoice 123's due date to next month"
- "Change invoice 456 status to sent"
- "Add a discount to invoice 789"`,

  inputSchema: InvoiceUpdateInputSchema,
  outputSchema: InvoiceSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof InvoiceUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof InvoiceSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'invoice_update',
      async (
        input: z.infer<typeof InvoiceUpdateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, invoiceId, lines, ...invoiceData } = input;

        logger.debug('Updating invoice', {
          accountId,
          invoiceId,
          fields: Object.keys(invoiceData),
        });

        // Build update payload using camelCase properties
        // The FreshBooks SDK's transformInvoiceRequest() will convert to API format
        const updates: Record<string, unknown> = {};

        if (invoiceData.customerId !== undefined) {
          updates.customerId = invoiceData.customerId;
        }
        if (invoiceData.createDate !== undefined) {
          updates.createDate = invoiceData.createDate;
        }
        if (invoiceData.dueDate !== undefined) {
          updates.dueDate = invoiceData.dueDate;
        }
        if (invoiceData.currencyCode !== undefined) {
          updates.currencyCode = invoiceData.currencyCode;
        }
        if (invoiceData.notes !== undefined) {
          updates.notes = invoiceData.notes;
        }
        if (invoiceData.terms !== undefined) {
          updates.terms = invoiceData.terms;
        }
        if (invoiceData.status !== undefined) {
          updates.status = invoiceData.status;
        }
        if (invoiceData.discount !== undefined) {
          updates.discountValue = invoiceData.discount.amount;
        }
        if (lines && lines.length > 0) {
          updates.lines = lines.map((line) => ({
            name: line.name,
            description: line.description || '',
            qty: line.qty || 1,
            unitCost: {
              amount: line.unitCost.amount,
              code: line.unitCost.code || invoiceData.currencyCode || 'USD',
            },
            taxName1: line.taxName1 || null,
            taxAmount1: line.taxAmount1 || null,
            taxName2: line.taxName2 || null,
            taxAmount2: line.taxAmount2 || null,
          }));
        }

        const result = await client.executeWithRetry(
          'invoice_update',
          async (fbClient) => {
            const response = await fbClient.invoices.update(accountId, String(invoiceId), updates);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { invoice: { ... } }
        const updatedInvoice = (result as { invoice?: unknown }).invoice ?? result;

        logger.info('Invoice updated successfully', {
          invoiceId,
        });

        return updatedInvoice as z.infer<typeof InvoiceSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
