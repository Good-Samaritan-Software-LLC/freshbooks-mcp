/**
 * client_create Tool
 *
 * Create a new client in FreshBooks.
 */

import { z } from 'zod';
import { ClientCreateInputSchema, ClientSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for client_create
 */
export const clientCreateTool = {
  name: 'client_create',
  description: `Create a new client/customer in FreshBooks.

WHEN TO USE:
- User wants to add a new client
- User says "create client", "add customer", "new client"
- Setting up a customer for invoicing or project tracking
- Before creating invoices or projects for a new customer

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- At least one of: fName, lName, organization, or email

OPTIONAL:
Contact:
- fName, lName: Client's name
- organization: Company name
- email: Email address (recommended for invoices)

Phone:
- busPhone, homePhone, mobPhone, fax

Address:
- pStreet, pStreet2, pCity, pProvince, pCode, pCountry (primary)
- sStreet, sStreet2, sCity, sProvince, sCode, sCountry (secondary)

Settings:
- currencyCode: e.g., USD, CAD, EUR
- language: Preferred language for invoices
- vatNumber, vatName: Tax identification
- allowLateFees, allowLateNotifications: Billing preferences
- note: Internal notes

RETURNS:
Created client with assigned ID and all configured settings.

EXAMPLES:
- "Create a new client: John Smith, john@example.com"
- "Add client Acme Corp with email billing@acme.com"
- "New client: Jane Doe, 123 Main St, New York, NY 10001"`,

  inputSchema: ClientCreateInputSchema,
  outputSchema: ClientSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ClientCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ClientSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'client_create',
      async (
        input: z.infer<typeof ClientCreateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, ...clientData } = input;

        logger.debug('Creating client', {
          accountId,
          hasEmail: !!clientData.email,
          hasOrganization: !!clientData.organization,
        });

        // Build client object for API (convert camelCase to snake_case)
        const clientPayload: Record<string, unknown> = {};

        // Contact information
        if (clientData.fName !== undefined) clientPayload.fname = clientData.fName;
        if (clientData.lName !== undefined) clientPayload.lname = clientData.lName;
        if (clientData.organization !== undefined) clientPayload.organization = clientData.organization;
        if (clientData.email !== undefined) clientPayload.email = clientData.email;

        // Phone numbers
        if (clientData.busPhone !== undefined) clientPayload.bus_phone = clientData.busPhone;
        if (clientData.homePhone !== undefined) clientPayload.home_phone = clientData.homePhone;
        if (clientData.mobPhone !== undefined) clientPayload.mob_phone = clientData.mobPhone;
        if (clientData.fax !== undefined) clientPayload.fax = clientData.fax;

        // Note
        if (clientData.note !== undefined) clientPayload.note = clientData.note;

        // Primary address
        if (clientData.pStreet !== undefined) clientPayload.p_street = clientData.pStreet;
        if (clientData.pStreet2 !== undefined) clientPayload.p_street2 = clientData.pStreet2;
        if (clientData.pCity !== undefined) clientPayload.p_city = clientData.pCity;
        if (clientData.pProvince !== undefined) clientPayload.p_province = clientData.pProvince;
        if (clientData.pCode !== undefined) clientPayload.p_code = clientData.pCode;
        if (clientData.pCountry !== undefined) clientPayload.p_country = clientData.pCountry;

        // Secondary address
        if (clientData.sStreet !== undefined) clientPayload.s_street = clientData.sStreet;
        if (clientData.sStreet2 !== undefined) clientPayload.s_street2 = clientData.sStreet2;
        if (clientData.sCity !== undefined) clientPayload.s_city = clientData.sCity;
        if (clientData.sProvince !== undefined) clientPayload.s_province = clientData.sProvince;
        if (clientData.sCode !== undefined) clientPayload.s_code = clientData.sCode;
        if (clientData.sCountry !== undefined) clientPayload.s_country = clientData.sCountry;

        // Financial settings
        if (clientData.currencyCode !== undefined) clientPayload.currency_code = clientData.currencyCode;
        if (clientData.language !== undefined) clientPayload.language = clientData.language;
        if (clientData.vatNumber !== undefined) clientPayload.vat_number = clientData.vatNumber;
        if (clientData.vatName !== undefined) clientPayload.vat_name = clientData.vatName;

        // Billing preferences
        if (clientData.allowLateFees !== undefined) clientPayload.allow_late_fees = clientData.allowLateFees;
        if (clientData.allowLateNotifications !== undefined) {
          clientPayload.allow_late_notifications = clientData.allowLateNotifications;
        }

        const result = await client.executeWithRetry(
          'client_create',
          async (fbClient) => {
            const response = await fbClient.clients.create(clientPayload, accountId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { client: { ... } }
        const createdClient = (result as { client?: unknown }).client ?? result;

        logger.info('Client created successfully', {
          clientId: (createdClient as { id?: number }).id,
        });

        return createdClient as z.infer<typeof ClientSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
