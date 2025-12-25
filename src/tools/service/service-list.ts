/**
 * Service List Tool
 *
 * List billable services with pagination.
 */

import { z } from "zod";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Input schema for service_list
 */
const ServiceListInputSchema = z.object({
  businessId: z.number().int().positive().describe("FreshBooks business ID"),
  page: z.number().int().positive().optional().describe("Page number (default: 1)"),
  perPage: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Results per page (default: 30, max: 100)"),
});

/**
 * Output schema for service_list
 */
const ServiceListOutputSchema = z.object({
  services: z.array(z.unknown()),
  pagination: z.object({
    page: z.number(),
    pages: z.number(),
    perPage: z.number(),
    total: z.number(),
  }),
});

/**
 * Tool definition for service_list
 */
export const serviceListTool = {
  name: "service_list",
  description: `List billable services from FreshBooks.

WHEN TO USE:
- User wants to see available service types
- Need to find a service ID for time entry
- Browse billable service options

REQUIRED INFO:
- Business ID (FreshBooks business/account identifier)

OPTIONAL PARAMETERS:
- page: Page number for pagination (default: 1)
- perPage: Results per page (default: 30, max: 100)

RETURNS:
Array of services with:
- Service ID, name, billable status
- Pagination metadata for large result sets

EXAMPLE PROMPTS:
- "Show me all my services"
- "List billable service types"
- "What services can I assign to time entries?"

NOTE: Services are immutable once created. Archived services have visState=1 or 2.`,

  inputSchema: ServiceListInputSchema,
  outputSchema: ServiceListOutputSchema,

  async execute(
    input: z.infer<typeof ServiceListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ServiceListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'service_list',
      async (input: z.infer<typeof ServiceListInputSchema>, _context: ToolContext) => {
        const { businessId } = input;

        const result = await client.executeWithRetry('service_list', async (fbClient) => {
          // Note: services.list() only accepts businessId, no query builders
          // Pagination parameters are ignored as the SDK doesn't support them for services
          const response = await fbClient.services.list(businessId);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Extract data
        const services = (result as any).services || [];
        const paginationData = (result as any).pages || {
          page: 1,
          pages: 1,
          total: services.length,
          per_page: 30,
        };

        return {
          services,
          pagination: {
            page: paginationData.page,
            pages: paginationData.pages,
            perPage: paginationData.per_page || paginationData.perPage || 30,
            total: paginationData.total,
          },
        };
      }
    );

    return handler(input, { businessId: input.businessId });
  },
};
