/**
 * Service Create Tool
 *
 * Create a new billable service in FreshBooks.
 * NOTE: Services are immutable once created - plan carefully!
 */

import { z } from "zod";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Input schema for service_create
 */
const ServiceCreateInputSchema = z.object({
  businessId: z.number().int().positive().describe("FreshBooks business ID"),
  name: z.string().min(1).describe("Service name (required)"),
  billable: z.boolean().default(true).describe("Whether service is billable"),
});

/**
 * Output schema for service_create
 */
const ServiceCreateOutputSchema = z.unknown();

/**
 * Tool definition for service_create
 */
export const serviceCreateTool = {
  name: "service_create",
  description: `Create a new billable service in FreshBooks.

WHEN TO USE:
- User needs a new service type for billing
- Setting up service categories for time tracking
- Creating specialized billing categories

REQUIRED INFO:
- Business ID
- Service name (descriptive label)

OPTIONAL PARAMETERS:
- billable: Whether service is billable (default: true)

IMPORTANT NOTES:
- Services are IMMUTABLE once created
- Cannot update service details later
- Use visState to archive unwanted services
- Plan service names carefully before creating

RETURNS:
Created service with:
- Service ID (for use in time entries)
- Name, billable status
- Business ID

EXAMPLE PROMPTS:
- "Create a service called Development"
- "Add a new billable service for Consulting"
- "Set up a service type for Design Work"

BEST PRACTICES:
- Use clear, descriptive names
- Consider creating non-billable services for internal work
- Archive old services rather than creating duplicates`,

  inputSchema: ServiceCreateInputSchema,
  outputSchema: ServiceCreateOutputSchema,

  async execute(
    input: z.infer<typeof ServiceCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ServiceCreateOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'service_create',
      async (input: z.infer<typeof ServiceCreateInputSchema>, _context: ToolContext) => {
        const { businessId, name, billable } = input;

        const result = await client.executeWithRetry('service_create', async (fbClient) => {
          const serviceData = {
            name,
            billable,
          };

          const response = await fbClient.services.create(serviceData as any, businessId);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return result;
      }
    );

    return handler(input, { accountId: String(input.businessId) });
  },
};
