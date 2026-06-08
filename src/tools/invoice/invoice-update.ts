/**
 * invoice_update Tool
 *
 * Update an existing invoice in FreshBooks.
 */

import { z } from 'zod';
import {
  InvoiceUpdateInputSchema,
  InvoiceSingleOutputSchema,
  INVOICE_STATUS_TO_NUMBER,
} from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';
import { toLocalMidnightDate, daysBetween } from '../../utils/dates.js';

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
- dueDate: Payment due date (YYYY-MM-DD) — stored by FreshBooks as an offset
  from the invoice date (derived automatically; reads the invoice first when
  createDate isn't also provided)
- dueOffsetDays: Days after the invoice date payment is due (alternative to dueDate)
- currencyCode: Currency code
- lines: Replace line items (replaces ALL existing lines)
- notes: Invoice notes
- terms: Payment terms
- status: Invoice status — only 'draft', 'sent', 'viewed', 'disputed' can be
  set directly (paid/partial/etc. are driven by payments, not settable)
- discountPercentage: Discount as a PERCENT of the subtotal (e.g. 10 = 10% off).
  NOT a dollar amount — FreshBooks only supports percentage discounts

PARTIAL UPDATES:
Only include fields you want to change. Omitted fields remain unchanged.
Note: Setting lines will REPLACE all existing line items.

RETURNS:
Updated invoice record with all current information.

EXAMPLES:
- "Update invoice 123's due date to next month"
- "Change invoice 456 status to sent"
- "Apply a 10% discount to invoice 789"`,

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
      InvoiceUpdateInputSchema,
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
          // Local-midnight so the SDK date transform doesn't shift it a day (#76).
          updates.createDate = toLocalMidnightDate(invoiceData.createDate);
        }
        // LIVE-VERIFIED: `due_date` is READ-ONLY on the wire (403 errno 1038)
        // and the SDK transform drops `dueDate` anyway — historically this was
        // a silent no-op. The writable knob is `due_offset_days`, relative to
        // create_date; derive it from dueDate (fetching the invoice's current
        // create_date when the caller doesn't supply createDate).
        if (invoiceData.dueOffsetDays !== undefined) {
          updates.dueOffsetDays = invoiceData.dueOffsetDays;
        } else if (invoiceData.dueDate !== undefined) {
          let baseDate: string | Date | undefined = invoiceData.createDate;
          if (baseDate === undefined) {
            const current = await client.executeWithRetry(
              'invoice_update',
              async (fbClient) => {
                const response = await fbClient.invoices.single(accountId, String(invoiceId));
                if (!response.ok) {
                  throw response.error;
                }
                return response.data;
              }
            );
            const currentInvoice = (current as { invoice?: { createDate?: string | Date } }).invoice ?? current;
            baseDate = (currentInvoice as { createDate?: string | Date }).createDate;
          }
          if (baseDate !== undefined) {
            updates.dueOffsetDays = daysBetween(baseDate, invoiceData.dueDate);
          }
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
          // LIVE-VERIFIED: the API requires the NUMERIC status code on write —
          // a string 422s with "The field 'status' must be a number." Map the
          // friendly name to the wire number (the SDK passes it through).
          updates.status = INVOICE_STATUS_TO_NUMBER[invoiceData.status];
        }
        // discount_value is a PERCENT on the wire (live-verified 2026-06-04);
        // see invoice-create.ts.
        if (invoiceData.discountPercentage !== undefined) {
          updates.discountValue = String(invoiceData.discountPercentage);
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
