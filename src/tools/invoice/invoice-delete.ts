/**
 * invoice_delete Tool
 *
 * Delete an invoice from FreshBooks.
 */

import { z } from 'zod';
import { InvoiceDeleteInputSchema, InvoiceDeleteOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for invoice_delete
 */
export const invoiceDeleteTool = {
  name: 'invoice_delete',
  description: `Delete an invoice from FreshBooks.

WHEN TO USE:
- User wants to remove an invoice
- User says "delete invoice", "remove invoice", "delete invoice ID 123"
- Cleaning up duplicate or test invoices
- Removing draft invoices that won't be sent

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- invoiceId: The invoice ID to delete (numeric)

IMPORTANT NOTES:
- This performs a soft delete (sets visState to deleted)
- Invoice data is preserved for accounting records
- Payment history remains intact
- Deleted invoices can potentially be restored
- Cannot delete invoices with payments - void them instead

ALTERNATIVE:
Instead of deletion, consider:
- Setting status to 'draft' to unpublish
- Voiding the invoice for accounting purposes

RETURNS:
Confirmation with success status and deleted invoice ID.

EXAMPLES:
- "Delete invoice 123"
- "Remove invoice ID 456"
- "Delete the draft invoice"`,

  inputSchema: InvoiceDeleteInputSchema,
  outputSchema: InvoiceDeleteOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof InvoiceDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof InvoiceDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'invoice_delete',
      async (
        input: z.infer<typeof InvoiceDeleteInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, invoiceId } = input;

        logger.debug('Deleting invoice', {
          accountId,
          invoiceId,
        });

        await client.executeWithRetry(
          'invoice_delete',
          async (fbClient) => {
            const response = await fbClient.invoices.delete(accountId, String(invoiceId));

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        logger.info('Invoice deleted successfully', {
          invoiceId,
        });

        return {
          success: true,
          invoiceId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
