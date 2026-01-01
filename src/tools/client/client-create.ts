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

        // Build client object for SDK (SDK expects camelCase, converts to snake_case internally)
        const clientPayload: Record<string, unknown> = {};

        // Contact information
        if (clientData.fName !== undefined) clientPayload.fName = clientData.fName;
        if (clientData.lName !== undefined) clientPayload.lName = clientData.lName;
        if (clientData.organization !== undefined) clientPayload.organization = clientData.organization;
        if (clientData.email !== undefined) clientPayload.email = clientData.email;

        // Phone numbers
        if (clientData.busPhone !== undefined) clientPayload.busPhone = clientData.busPhone;
        if (clientData.homePhone !== undefined) clientPayload.homePhone = clientData.homePhone;
        if (clientData.mobPhone !== undefined) clientPayload.mobPhone = clientData.mobPhone;
        if (clientData.fax !== undefined) clientPayload.fax = clientData.fax;

        // Note
        if (clientData.note !== undefined) clientPayload.note = clientData.note;

        // Primary address
        if (clientData.pStreet !== undefined) clientPayload.pStreet = clientData.pStreet;
        if (clientData.pStreet2 !== undefined) clientPayload.pStreet2 = clientData.pStreet2;
        if (clientData.pCity !== undefined) clientPayload.pCity = clientData.pCity;
        if (clientData.pProvince !== undefined) clientPayload.pProvince = clientData.pProvince;
        if (clientData.pCode !== undefined) clientPayload.pCode = clientData.pCode;
        if (clientData.pCountry !== undefined) clientPayload.pCountry = clientData.pCountry;

        // Secondary address
        if (clientData.sStreet !== undefined) clientPayload.sStreet = clientData.sStreet;
        if (clientData.sStreet2 !== undefined) clientPayload.sStreet2 = clientData.sStreet2;
        if (clientData.sCity !== undefined) clientPayload.sCity = clientData.sCity;
        if (clientData.sProvince !== undefined) clientPayload.sProvince = clientData.sProvince;
        if (clientData.sCode !== undefined) clientPayload.sCode = clientData.sCode;
        if (clientData.sCountry !== undefined) clientPayload.sCountry = clientData.sCountry;

        // Financial settings
        if (clientData.currencyCode !== undefined) clientPayload.currencyCode = clientData.currencyCode;
        if (clientData.language !== undefined) clientPayload.language = clientData.language;
        if (clientData.vatNumber !== undefined) clientPayload.vatNumber = clientData.vatNumber;
        if (clientData.vatName !== undefined) clientPayload.vatName = clientData.vatName;

        // Billing preferences
        if (clientData.allowLateFees !== undefined) clientPayload.allowLateFees = clientData.allowLateFees;
        if (clientData.allowLateNotifications !== undefined) {
          clientPayload.allowLateNotifications = clientData.allowLateNotifications;
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
