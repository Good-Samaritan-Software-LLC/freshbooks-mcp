/**
 * client_list Tool
 *
 * List clients from FreshBooks with filtering and pagination.
 */

import { z } from 'zod';
import { ClientListInputSchema, ClientListOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for client_list
 */
export const clientListTool = {
  name: 'client_list',
  description: `List clients from FreshBooks with optional filtering and pagination.

WHEN TO USE:
- User asks to "see clients", "list clients", "show all customers"
- User wants to find a client by name, email, or organization
- User needs to select a client for invoicing or project setup
- Getting client information for time tracking context

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)

OPTIONAL FILTERS:
- email: Find client by exact email address
- organization: Search by company name (partial match)
- fName: Search by first name (partial match)
- lName: Search by last name (partial match)
- visState: Filter by status (0=active, 1=deleted, 2=archived)

PAGINATION:
- page: Page number (default: 1)
- perPage: Results per page (default: 30, max: 100)

RETURNS:
Array of clients with:
- id: Client ID
- fName, lName: Contact name
- organization: Company name
- email: Email address
- Phone numbers, addresses
- currencyCode: Billing currency
- visState: Status
Plus pagination metadata (page, pages, total)

EXAMPLES:
- "Show me all active clients"
- "List clients with 'Acme' in their organization name"
- "Find the client with email john@example.com"
- "Show all archived clients"`,

  inputSchema: ClientListInputSchema,
  outputSchema: ClientListOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ClientListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ClientListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'client_list',
      async (
        input: z.infer<typeof ClientListInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Listing clients', {
          accountId: input.accountId,
          filters: {
            email: input.email,
            organization: input.organization,
            visState: input.visState,
          },
        });

        const result = await client.executeWithRetry(
          'client_list',
          async (fbClient) => {
            // Import query builders from SDK
            const { SearchQueryBuilder, PaginationQueryBuilder } = await import(
              '@freshbooks/api/dist/models/builders/index.js'
            );

            // Build query builders
            const queryBuilders: any[] = [];

            // Add pagination
            if (input.page || input.perPage) {
              const pagination = new PaginationQueryBuilder()
                .page(input.page || 1)
                .perPage(input.perPage || 30);
              queryBuilders.push(pagination);
            }

            // Add search filters
            const hasFilters =
              input.email ||
              input.organization ||
              input.fName ||
              input.lName ||
              input.visState !== undefined;

            if (hasFilters) {
              const search = new SearchQueryBuilder();

              if (input.email) {
                search.equals('email', input.email);
              }
              if (input.organization) {
                search.like('organization', input.organization);
              }
              if (input.fName) {
                search.like('fname', input.fName);
              }
              if (input.lName) {
                search.like('lname', input.lName);
              }
              if (input.visState !== undefined) {
                search.equals('vis_state', input.visState);
              }

              queryBuilders.push(search);
            }

            // Call FreshBooks API
            const response = await fbClient.clients.list(
              input.accountId,
              queryBuilders
            );

            if (!response.ok) {
              throw response.error;
            }

            const clients = response.data?.clients || [];
            const pagesData = response.data?.pages as any;
            const pagination = {
              total: pagesData?.total || 0,
              page: pagesData?.page || 1,
              perPage: pagesData?.perPage || pagesData?.per_page || pagesData?.size || 30,
              pages: pagesData?.pages || 1,
            };

            return {
              pagination,
              clients,
            } as z.infer<typeof ClientListOutputSchema>;
          }
        );

        logger.info('Clients listed successfully', {
          count: result.clients.length,
          total: result.pagination.total,
        });

        return result;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
