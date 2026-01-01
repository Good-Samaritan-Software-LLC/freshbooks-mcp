/**
 * invoice_create Tool
 *
 * Create a new invoice in FreshBooks.
 */

import { z } from 'zod';
import { InvoiceCreateInputSchema, InvoiceSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for invoice_create
 */
export const invoiceCreateTool = {
  name: 'invoice_create',
  description: `Create a new invoice in FreshBooks.

WHEN TO USE:
- User wants to create a new invoice
- User says "create invoice", "bill client", "new invoice"
- After completing work that needs to be billed
- Setting up recurring billing for a client

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- customerId: Client ID (use client_list to find)
- lines: At least one line item with name, quantity, and unit cost

LINE ITEMS:
Each line must have:
- name: Description of service/product
- qty: Quantity (default: 1)
- unitCost: { amount: "100.00", code: "USD" }

Optional per line:
- description: Additional details
- taxName1, taxAmount1: First tax
- taxName2, taxAmount2: Second tax

OPTIONAL:
- createDate: Invoice date (YYYY-MM-DD, defaults to today)
- dueDate: Payment due date (YYYY-MM-DD)
- currencyCode: Currency (default: USD)
- notes: Notes to appear on invoice
- terms: Payment terms
- discount: { amount: "10.00" } or percentage

RETURNS:
Created invoice with assigned ID, calculated totals, and status.

EXAMPLES:
- "Create an invoice for client 123 for $500 consulting"
- "Bill client 456 for 10 hours at $150/hour"
- "New invoice with two line items"`,

  inputSchema: InvoiceCreateInputSchema,
  outputSchema: InvoiceSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof InvoiceCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof InvoiceSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'invoice_create',
      async (
        input: z.infer<typeof InvoiceCreateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, ...invoiceData } = input;

        logger.debug('Creating invoice', {
          accountId,
          customerId: invoiceData.customerId,
          lineCount: invoiceData.lines.length,
        });

        // Build invoice payload
        const invoicePayload: Record<string, unknown> = {
          customerid: invoiceData.customerId,
          create_date: invoiceData.createDate || new Date().toISOString().split('T')[0],
          currency_code: invoiceData.currencyCode || 'USD',
          lines: invoiceData.lines.map((line) => ({
            name: line.name,
            description: line.description || '',
            qty: line.qty || 1,
            unit_cost: {
              amount: line.unitCost.amount,
              code: line.unitCost.code || invoiceData.currencyCode || 'USD',
            },
            taxName1: line.taxName1 || null,
            taxAmount1: line.taxAmount1 || null,
            taxName2: line.taxName2 || null,
            taxAmount2: line.taxAmount2 || null,
          })),
        };

        if (invoiceData.dueDate) {
          invoicePayload.due_date = invoiceData.dueDate;
        }
        if (invoiceData.notes) {
          invoicePayload.notes = invoiceData.notes;
        }
        if (invoiceData.terms) {
          invoicePayload.terms = invoiceData.terms;
        }
        if (invoiceData.discount) {
          invoicePayload.discount_value = {
            amount: invoiceData.discount.amount,
            code: invoiceData.discount.code || invoiceData.currencyCode || 'USD',
          };
        }

        const result = await client.executeWithRetry(
          'invoice_create',
          async (fbClient) => {
            const response = await fbClient.invoices.create(invoicePayload as any, accountId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { invoice: { ... } }
        const createdInvoice = (result as { invoice?: unknown }).invoice ?? result;

        logger.info('Invoice created successfully', {
          invoiceId: (createdInvoice as { id?: number }).id,
        });

        return createdInvoice as z.infer<typeof InvoiceSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
