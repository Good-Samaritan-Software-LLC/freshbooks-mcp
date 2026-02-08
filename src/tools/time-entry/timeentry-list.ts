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
import { buildQueryBuilders, type QueryBuilderType } from '../base-tool.js';

/**
 * Custom query builder for time entry date filters.
 *
 * The FreshBooks Time Entries API expects date filters as top-level query parameters:
 * - started_from: Filter entries started on or after this datetime
 * - started_to: Filter entries started on or before this datetime
 *
 * This is different from the standard SearchQueryBuilder.between() which generates
 * search[field_min] and search[field_max] parameters.
 */
class TimeEntryDateFilterBuilder {
  private params: string[] = [];

  startedFrom(date: string): this {
    this.params.push(`started_from=${encodeURIComponent(date)}`);
    return this;
  }

  startedTo(date: string): this {
    this.params.push(`started_to=${encodeURIComponent(date)}`);
    return this;
  }

  build(): string {
    return this.params.join('&');
  }
}

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
- businessId: FreshBooks business ID (get from user_me -> businessMemberships[].business.id)

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

SORTING:
- sortBy: Field to sort by (started_at, created_at, duration)
- sortOrder: Sort direction (asc or desc, default: desc for most recent first)

INCLUDES:
- include: Related data to fetch (client, project, task, service)
  - client: Client details associated with the time entry
  - project: Project details for the time entry
  - task: Task information if assigned
  - service: Service type for billing categorization

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
- "Find active timers sorted by duration"
- "Get time entries with project details included"`,

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
          businessId: input.businessId,
          filters: {
            projectId: input.projectId,
            clientId: input.clientId,
            active: input.active,
          },
        });

        const result = await client.executeWithRetry(
          'timeentry_list',
          async (fbClient) => {
            // Build query builders using the helper
            const queryBuilders = await buildQueryBuilders({
              page: input.page,
              perPage: input.perPage,
              sortBy: input.sortBy,
              sortOrder: input.sortOrder,
              include: input.include,
              searchFilters: (search) => {
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
                // Note: Date filters (startedAfter/startedBefore) are handled separately
                // using TimeEntryDateFilterBuilder because the FreshBooks API expects
                // started_from and started_to as top-level query parameters, not search params.
              },
            });

            // Add date filters using custom builder (top-level query params)
            if (input.startedAfter || input.startedBefore) {
              const dateFilter = new TimeEntryDateFilterBuilder();
              if (input.startedAfter) {
                dateFilter.startedFrom(input.startedAfter);
              }
              if (input.startedBefore) {
                dateFilter.startedTo(input.startedBefore);
              }
              queryBuilders.push(dateFilter as unknown as QueryBuilderType);
            }

            // Call FreshBooks API
            const response = await fbClient.timeEntries.list(
              input.businessId,
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

    return handler(input, { businessId: input.businessId }) as any;
  },
};
