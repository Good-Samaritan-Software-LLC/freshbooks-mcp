/**
 * Service Rate Set Tool
 *
 * Set or update the billing rate for a service.
 * This is the ONLY mutable aspect of services.
 */

import { z } from "zod";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Input schema for service_rate_set
 */
const ServiceRateSetInputSchema = z.object({
  businessId: z.number().int().positive().describe("FreshBooks business ID"),
  serviceId: z.number().int().positive().describe("Service ID"),
  rate: z.string().describe('Rate amount as decimal string (e.g., "75.00")'),
  code: z.string().default("USD").describe("Currency code (e.g., USD)"),
});

/**
 * Output schema for service_rate_set
 */
const ServiceRateSetOutputSchema = z.object({
  rate: z.string().describe("Rate amount as decimal string"),
  code: z.string().describe("Currency code (e.g., USD)"),
});

/**
 * Tool definition for service_rate_set
 */
export const serviceRateSetTool = {
  name: "service_rate_set",
  description: `Set or update the billing rate for a service in FreshBooks.

WHEN TO USE:
- Setting initial pricing for a new service
- Updating rates for existing services
- Changing billing amounts

REQUIRED INFO:
- Business ID
- Service ID
- Rate amount (as decimal string, e.g., "75.00")

OPTIONAL PARAMETERS:
- code: Currency code (default: USD)

IMPORTANT:
- This is the ONLY way to modify service information
- Services themselves are immutable (name, billable status cannot change)
- Rates can be updated as needed

RETURNS:
Updated rate configuration:
- rate: New amount as decimal string
- code: Currency code

EXAMPLE PROMPTS:
- "Set the rate for service 123 to $75 per hour"
- "Update Development service rate to $100"
- "Change the billing rate for service 456 to 85.50"

BEST PRACTICES:
- Use decimal format for rates (e.g., "75.00", not "75")
- Specify currency if not USD
- Keep rates current to ensure accurate billing`,

  inputSchema: ServiceRateSetInputSchema,
  outputSchema: ServiceRateSetOutputSchema,

  async execute(
    input: z.infer<typeof ServiceRateSetInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ServiceRateSetOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'service_rate_set',
      async (input: z.infer<typeof ServiceRateSetInputSchema>, _context: ToolContext) => {
        const { businessId, serviceId, rate, code } = input;

        const result = await client.executeWithRetry('service_rate_set', async (fbClient) => {
          const rateData = {
            rate,
            code,
          };

          // First try to create (if rate doesn't exist)
          // If it exists, this will fail and we'll update instead
          let response = await fbClient.services.rate.create(rateData as any, businessId, serviceId);

          // If create failed with "already exists" type error, try update
          if (!response.ok && response.error?.message?.includes('exists')) {
            response = await fbClient.services.rate.update(rateData as any, businessId, serviceId);
          }

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return result as z.infer<typeof ServiceRateSetOutputSchema>;
      }
    );

    return handler(input, { businessId: input.businessId });
  },
};
