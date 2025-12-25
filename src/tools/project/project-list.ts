/**
 * Project List Tool
 *
 * List projects with pagination and optional filtering.
 */

import { z } from "zod";
import { ProjectListInputSchema, ProjectListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Tool definition for project_list
 */
export const projectListTool = {
  name: "project_list",
  description: `List projects from FreshBooks with optional filtering and pagination.

WHEN TO USE:
- User asks to "see projects", "list projects", "show all projects"
- User wants to find a project by name or client
- User needs project information for time tracking context

FILTERING OPTIONS:
- clientId: Filter by specific client
- active: Show only active/inactive projects
- complete: Show only complete/incomplete projects
- internal: Show only internal/billable projects
- title: Search by project name (partial match)

PAGINATION:
- Use page/perPage for large result sets
- Default: 30 results per page
- Maximum: 100 results per page

EXAMPLE PROMPTS:
- "Show me all active projects"
- "List projects for client ABC123"
- "Find projects with 'Website' in the title"
- "Show incomplete projects"

RETURNS:
Array of projects with titles, clients, billing info, and time logged.
Includes pagination metadata for navigating large result sets.`,

  inputSchema: ProjectListInputSchema,
  outputSchema: ProjectListOutputSchema,

  async execute(
    input: z.infer<typeof ProjectListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ProjectListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      "project_list",
      async (input: z.infer<typeof ProjectListInputSchema>, _context: ToolContext) => {
        const { accountId, page, perPage, ...filters } = input;

        // Execute the API call
        const result = await client.executeWithRetry(
          "project_list",
          async (fbClient) => {
            const { PaginationQueryBuilder, SearchQueryBuilder } = await import(
              "@freshbooks/api/dist/models/builders/index.js"
            );

            // Build query builders array
            const queryBuilders: any[] = [];

            // Add pagination if specified
            if (page !== undefined || perPage !== undefined) {
              const pagination = new PaginationQueryBuilder();
              if (page !== undefined) pagination.page(page);
              if (perPage !== undefined) pagination.perPage(perPage);
              queryBuilders.push(pagination);
            }

            // Add search filters if any specified
            if (Object.keys(filters).length > 0) {
              const search = new SearchQueryBuilder();

              if (filters.clientId !== undefined) {
                search.equals("client_id", filters.clientId);
              }
              if (filters.active !== undefined) {
                search.boolean("active", filters.active);
              }
              if (filters.complete !== undefined) {
                search.boolean("complete", filters.complete);
              }
              if (filters.internal !== undefined) {
                search.boolean("internal", filters.internal);
              }
              if (filters.title !== undefined) {
                search.like("title", filters.title);
              }

              queryBuilders.push(search);
            }

            const response = await fbClient.projects.list(parseInt(accountId), queryBuilders);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // Extract data
        const projects = (result as any).projects || [];
        const paginationData = (result as any).pages || {
          page: 1,
          pages: 1,
          total: projects.length,
          per_page: 30,
        };

        return {
          projects,
          pagination: {
            page: paginationData.page,
            pages: paginationData.pages,
            perPage: paginationData.per_page || paginationData.perPage || 30,
            total: paginationData.total,
          },
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};

/**
 * Wrapped handler for backward compatibility with tests
 */
export async function handleProjectList(
  input: z.infer<typeof ProjectListInputSchema>,
  context: { client: FreshBooksClientWrapper }
): Promise<z.infer<typeof ProjectListOutputSchema>> {
  return projectListTool.execute(input, context.client);
}
