/**
 * invoice_single Tool
 *
 * Retrieve a single invoice by ID.
 */

import { z } from 'zod';
import { InvoiceSingleInputSchema, InvoiceSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for invoice_single
 */
export const invoiceSingleTool = {
  name: 'invoice_single',
  description: `Retrieve a single invoice's full details from FreshBooks.

WHEN TO USE:
- User asks for details about a specific invoice
- User says "show me invoice #123", "get invoice details for ID 456"
- Need complete invoice information including line items
- Checking invoice status, amounts, or payment history

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- invoiceId: The FreshBooks invoice ID (numeric)

RETURNS:
Complete invoice record including:
- Invoice number, dates, status
- Customer/client information
- Line items with quantities and amounts
- Outstanding and paid amounts
- Notes and terms

EXAMPLES:
- "Show me invoice 12345"
- "Get details for invoice ID 789"
- "What's the status of invoice 456?"`,

  inputSchema: InvoiceSingleInputSchema,
  outputSchema: InvoiceSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof InvoiceSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof InvoiceSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'invoice_single',
      async (
        input: z.infer<typeof InvoiceSingleInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Getting invoice', {
          accountId: input.accountId,
          invoiceId: input.invoiceId,
        });

        const result = await client.executeWithRetry(
          'invoice_single',
          async (fbClient) => {
            const response = await fbClient.invoices.single(
              input.accountId,
              String(input.invoiceId)
            );

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { invoice: { ... } }
        const invoiceData = (result as { invoice?: unknown }).invoice ?? result;

        logger.info('Invoice retrieved successfully', {
          invoiceId: input.invoiceId,
        });

        return invoiceData as z.infer<typeof InvoiceSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
