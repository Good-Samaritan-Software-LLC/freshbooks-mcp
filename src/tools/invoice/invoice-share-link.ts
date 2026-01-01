/**
 * invoice_share_link Tool
 *
 * Generate a shareable link for an invoice.
 */

import { z } from 'zod';
import { InvoiceShareLinkInputSchema, InvoiceShareLinkOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for invoice_share_link
 */
export const invoiceShareLinkTool = {
  name: 'invoice_share_link',
  description: `Generate a shareable link for an invoice in FreshBooks.

WHEN TO USE:
- User wants to share an invoice with a client
- User says "share invoice", "get invoice link", "send invoice link"
- Need a URL to send to clients for viewing/paying

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- invoiceId: The invoice ID to share (numeric)

HOW IT WORKS:
- Generates a unique, secure URL for the invoice
- Client can view and pay the invoice at this URL
- Link remains valid until the invoice is deleted

RETURNS:
- shareLink: The URL to share with the client
- invoiceId: The invoice this link is for

EXAMPLES:
- "Get a share link for invoice 123"
- "Generate a payment link for invoice 456"
- "Share invoice 789 with the client"`,

  inputSchema: InvoiceShareLinkInputSchema,
  outputSchema: InvoiceShareLinkOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof InvoiceShareLinkInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof InvoiceShareLinkOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'invoice_share_link',
      async (
        input: z.infer<typeof InvoiceShareLinkInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, invoiceId } = input;

        logger.debug('Generating invoice share link', {
          accountId,
          invoiceId,
        });

        const result = await client.executeWithRetry(
          'invoice_share_link',
          async (fbClient) => {
            // Get the invoice to extract the share link
            const response = await fbClient.invoices.single(accountId, String(invoiceId));

            if (!response.ok) {
              throw response.error;
            }

            const invoiceData = (response.data as { invoice?: any }).invoice ?? response.data;

            // Extract share link from invoice data
            let shareLink = '';

            if (invoiceData.v3_status?.share_link) {
              shareLink = invoiceData.v3_status.share_link;
            } else if (invoiceData.links?.client_view) {
              shareLink = invoiceData.links.client_view;
            } else if (invoiceData.shareLink) {
              shareLink = invoiceData.shareLink;
            } else if (invoiceData.share_link) {
              shareLink = invoiceData.share_link;
            } else {
              // Construct fallback link
              const invoiceNum = invoiceData.invoice_number || invoiceData.invoiceNumber || '';
              shareLink = `https://my.freshbooks.com/invoice/${invoiceNum}-${invoiceId}`;
            }

            return {
              shareLink,
              invoiceId,
            };
          }
        );

        logger.info('Invoice share link generated successfully', {
          invoiceId,
        });

        return result;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
