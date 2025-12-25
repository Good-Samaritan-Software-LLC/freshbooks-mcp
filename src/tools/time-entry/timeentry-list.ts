/**
 * timeentry_list Tool
 *
 * List time entries from FreshBooks with filtering and pagination.
 */

import { z } from 'zod';
import { TimeEntryListInputSchema, TimeEntryListOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for timeentry_list
 */
export const timeentryListTool = {
  name: 'timeentry_list',
  description: `List time entries from FreshBooks.

WHEN TO USE:
- User asks to see their time entries, logged hours, or time tracking history
- User wants to review time for a specific project or client
- User needs to find entries within a date range
- User wants to see active/running timers
- User asks "show my time entries", "what time did I log today", "time on project X"

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)

OPTIONAL FILTERS:
- projectId: Filter by specific project
- clientId: Filter by specific client
- taskId: Filter by specific task
- serviceId: Filter by specific service
- active: Filter by active status (true = running timers only)
- billable: Filter by billable status
- billed: Filter by whether already billed
- startedAfter: Show entries after this date (ISO 8601)
- startedBefore: Show entries before this date (ISO 8601)

PAGINATION:
- page: Page number (default: 1)
- perPage: Results per page (default: 30, max: 100)

RETURNS:
Array of time entries with:
- duration: Time in seconds
- note: Description of work
- startedAt: When the entry began
- projectId, clientId, taskId, serviceId: Associated entities
- billable, billed: Billing status
- active: Whether timer is currently running
Plus pagination metadata (page, pages, total)

EXAMPLES:
- "Show my time entries for today"
- "List time logged on project 123"
- "Show billable time entries from last week"
- "Find active timers"`,

  inputSchema: TimeEntryListInputSchema,
  outputSchema: TimeEntryListOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof TimeEntryListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TimeEntryListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'timeentry_list',
      async (
        input: z.infer<typeof TimeEntryListInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Listing time entries', {
          accountId: input.accountId,
          filters: {
            projectId: input.projectId,
            clientId: input.clientId,
            active: input.active,
          },
        });

        const result = await client.executeWithRetry(
          'timeentry_list',
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
              input.projectId ||
              input.clientId ||
              input.taskId ||
              input.serviceId ||
              input.active !== undefined ||
              input.billable !== undefined ||
              input.billed !== undefined ||
              input.startedAfter ||
              input.startedBefore;

            if (hasFilters) {
              const search = new SearchQueryBuilder();

              if (input.projectId) {
                search.equals('project_id', input.projectId);
              }
              if (input.clientId) {
                search.equals('client_id', input.clientId);
              }
              if (input.taskId) {
                search.equals('task_id', input.taskId);
              }
              if (input.serviceId) {
                search.equals('service_id', input.serviceId);
              }
              if (input.active !== undefined) {
                search.boolean('active', input.active);
              }
              if (input.billable !== undefined) {
                search.boolean('billable', input.billable);
              }
              if (input.billed !== undefined) {
                search.boolean('billed', input.billed);
              }
              if (input.startedAfter) {
                search.between('started_at', {
                  min: input.startedAfter,
                  max: input.startedBefore || new Date().toISOString(),
                });
              } else if (input.startedBefore) {
                search.between('started_at', {
                  min: '1970-01-01T00:00:00Z',
                  max: input.startedBefore,
                });
              }

              queryBuilders.push(search);
            }

            // Call FreshBooks API
            const response = await fbClient.timeEntries.list(
              parseInt(input.accountId),
              queryBuilders
            );

            if (!response.ok) {
              throw response.error;
            }

            const responseData = response.data as any;
            const paginationData = responseData?.pages || {};

            return {
              timeEntries: responseData?.timeEntries || [],
              pagination: {
                page: paginationData.page || 1,
                pages: paginationData.pages || 1,
                perPage: paginationData.per_page || paginationData.perPage || 30,
                total: paginationData.total || 0,
              },
            };
          }
        );

        logger.info('Time entries listed successfully', {
          count: result.timeEntries.length,
          total: result.pagination.total,
        });

        return result as any;
      }
    );

    return handler(input, { accountId: input.accountId }) as any;
  },
};
