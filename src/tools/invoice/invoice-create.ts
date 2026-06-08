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
import { toLocalMidnightDate, daysBetween } from '../../utils/dates.js';

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
- dueDate: Payment due date (YYYY-MM-DD) — stored by FreshBooks as an offset
  from the invoice date (derived automatically)
- dueOffsetDays: Days after the invoice date payment is due (alternative to dueDate)
- currencyCode: Currency (default: USD)
- notes: Notes to appear on invoice
- terms: Payment terms
- discountPercentage: Discount as a PERCENT of the subtotal (e.g. 10 = 10% off).
  NOT a dollar amount — FreshBooks only supports percentage discounts

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
      InvoiceCreateInputSchema,
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

        // Build invoice payload using camelCase properties
        // The FreshBooks SDK's transformInvoiceRequest() will convert to API format
        const invoicePayload: Record<string, unknown> = {
          customerId: invoiceData.customerId,
          // Local-midnight so the SDK date transform doesn't shift it a day (#76).
          // Default to a local `new Date()` (not a UTC date string) for the same reason.
          createDate: toLocalMidnightDate(invoiceData.createDate) || new Date(),
          currencyCode: invoiceData.currencyCode || 'USD',
          lines: invoiceData.lines.map((line) => ({
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
          })),
        };

        // LIVE-VERIFIED: `due_date` is READ-ONLY on the wire (403 errno 1038
        // "Write access denied ... field due_date") — and the SDK transform
        // drops `dueDate` anyway, so it never even reached the API. The
        // writable knob is `due_offset_days` (SDK: `dueOffsetDays`), which
        // FreshBooks adds to create_date to derive due_date. Same API design
        // as bills (#80).
        if (invoiceData.dueOffsetDays !== undefined) {
          invoicePayload.dueOffsetDays = invoiceData.dueOffsetDays;
        } else if (invoiceData.dueDate) {
          const now = new Date();
          const baseDate =
            invoiceData.createDate ??
            new Date(now.getFullYear(), now.getMonth(), now.getDate());
          invoicePayload.dueOffsetDays = daysBetween(baseDate, invoiceData.dueDate);
        }
        if (invoiceData.notes) {
          invoicePayload.notes = invoiceData.notes;
        }
        if (invoiceData.terms) {
          invoicePayload.terms = invoiceData.terms;
        }
        // discount_value is a PERCENT on the wire (live-verified 2026-06-04:
        // '10.00' on a $1000 invoice deducts $100). Sent as a string, which is
        // the proven-working wire format.
        if (invoiceData.discountPercentage !== undefined) {
          invoicePayload.discountValue = String(invoiceData.discountPercentage);
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
