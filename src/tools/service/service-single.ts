/**
 * Service Single Tool
 *
 * Retrieve a single service by ID.
 */

import { z } from "zod";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Input schema for service_single
 */
const ServiceSingleInputSchema = z.object({
  businessId: z.number().int().positive().describe("FreshBooks business ID"),
  serviceId: z.number().int().positive().describe("Service ID to retrieve"),
});

/**
 * Output schema for service_single
 */
const ServiceSingleOutputSchema = z.unknown();

/**
 * Tool definition for service_single
 */
export const serviceSingleTool = {
  name: "service_single",
  description: `Get a single service by ID from FreshBooks.

WHEN TO USE:
- Need detailed information about a specific service
- Verify service settings before using
- Check if a service exists

REQUIRED INFO:
- Business ID
- Service ID (numeric identifier)

RETURNS:
Complete service details including:
- Service ID, name, billable status
- Visibility state (active/archived)

EXAMPLE PROMPTS:
- "Get details for service 12345"
- "Show me service information for ID 789"
- "What is service 456 used for?"

NOTE: This does not return the service rate. Use service_rate_get for pricing.`,

  inputSchema: ServiceSingleInputSchema,
  outputSchema: ServiceSingleOutputSchema,

  async execute(
    input: z.infer<typeof ServiceSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ServiceSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'service_single',
      async (input: z.infer<typeof ServiceSingleInputSchema>, _context: ToolContext) => {
        const { businessId, serviceId } = input;

        const result = await client.executeWithRetry('service_single', async (fbClient) => {
          const response = await fbClient.services.single(businessId, serviceId);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return result;
      }
    );

    return handler(input, { businessId: input.businessId });
  },
};
