/**
 * expense_list Tool
 *
 * List business expenses with pagination and optional filtering.
 */

import { z } from 'zod';
import { ExpenseListInputSchema, ExpenseListOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for expense_list
 */
export const expenseListTool = {
  name: 'expense_list',
  description: `List business expenses from FreshBooks with optional filtering and pagination.

WHEN TO USE:
- User asks to "see expenses", "list expenses", "show my expenses"
- User wants to find expenses for a specific client, project, or category
- User needs expense information for billing or reporting
- User wants to track spending by date range

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)

OPTIONAL FILTERS:
- clientId: Filter by specific client
- projectId: Filter by specific project
- categoryId: Filter by expense category (travel, meals, supplies, etc.)
- status: Filter by expense status (outstanding, invoiced, partial, paid)
- dateMin/dateMax: Filter by date range (ISO 8601)

PAGINATION:
- page: Page number (default: 1)
- perPage: Results per page (default: 30, max: 100)

EXAMPLE PROMPTS:
- "Show me all expenses from last month"
- "List expenses for project 12345"
- "What expenses do I have for client ABC?"
- "Show outstanding expenses that haven't been invoiced yet"

RETURNS:
Array of expenses with amounts, vendors, dates, categories, and billing status.
Includes pagination metadata for navigating large result sets.`,

  inputSchema: ExpenseListInputSchema,
  outputSchema: ExpenseListOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ExpenseListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ExpenseListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'expense_list',
      async (
        input: z.infer<typeof ExpenseListInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Listing expenses', {
          accountId: input.accountId,
          filters: {
            clientId: input.clientId,
            projectId: input.projectId,
            categoryId: input.categoryId,
            status: input.status,
          },
        });

        const result = await client.executeWithRetry(
          'expense_list',
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
              input.clientId ||
              input.projectId ||
              input.categoryId ||
              input.status ||
              input.dateMin ||
              input.dateMax;

            if (hasFilters) {
              const search = new SearchQueryBuilder();

              if (input.clientId) {
                search.equals('clientid', input.clientId);
              }
              if (input.projectId) {
                search.equals('projectid', input.projectId);
              }
              if (input.categoryId) {
                search.equals('categoryid', input.categoryId);
              }
              if (input.status) {
                search.equals('status', input.status);
              }
              if (input.dateMin || input.dateMax) {
                const minDate = input.dateMin ?? '1970-01-01T00:00:00Z';
                const maxDate = input.dateMax ?? new Date().toISOString();
                search.between('date', { min: minDate, max: maxDate });
              }

              queryBuilders.push(search);
            }

            // Call FreshBooks API
            const response = await fbClient.expenses.list(
              input.accountId,
              queryBuilders
            );

            if (!response.ok) {
              throw response.error;
            }

            const data = response.data!;
            return {
              expenses: (data as any).expenses || [],
              pagination: {
                page: (data as any).pages?.page || 1,
                pages: (data as any).pages?.pages || 1,
                perPage: (data as any).pages?.perPage || (data as any).pages?.per_page || 30,
                total: (data as any).pages?.total || 0,
              },
            };
          }
        );

        logger.info('Expenses listed successfully', {
          count: result.expenses.length,
          total: result.pagination.total,
        });

        return result as z.infer<typeof ExpenseListOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
