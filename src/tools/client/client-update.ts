/**
 * client_update Tool
 *
 * Update an existing client's information.
 */

import { z } from 'zod';
import { ClientUpdateInputSchema, ClientSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for client_update
 */
export const clientUpdateTool = {
  name: 'client_update',
  description: `Update an existing client's information in FreshBooks.

WHEN TO USE:
- User wants to modify client details
- User says "update client", "change client info", "edit customer"
- Correcting client contact information
- Updating billing address or preferences
- Changing client status (archive/activate)

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- clientId: The client ID to update (numeric)
- At least one field to update

UPDATABLE FIELDS:
Contact: fName, lName, organization, email
Phones: busPhone, homePhone, mobPhone, fax
Primary address: pStreet, pStreet2, pCity, pProvince, pCode, pCountry
Secondary address: sStreet, sStreet2, sCity, sProvince, sCode, sCountry
Financial: currencyCode, language, vatNumber, vatName
Preferences: allowLateFees, allowLateNotifications
Status: visState (0=active, 1=deleted, 2=archived)
Notes: note

PARTIAL UPDATES:
Only include fields you want to change. Omitted fields remain unchanged.

RETURNS:
Updated client record with all current information.

EXAMPLES:
- "Update client 123's email to newemail@example.com"
- "Change client 456's address to 789 Oak Street, Boston, MA"
- "Archive client 789 (set visState to 2)"
- "Enable late fees for client 234"`,

  inputSchema: ClientUpdateInputSchema,
  outputSchema: ClientSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ClientUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ClientSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'client_update',
      async (
        input: z.infer<typeof ClientUpdateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, clientId, ...updateData } = input;

        logger.debug('Updating client', {
          accountId,
          clientId,
          fields: Object.keys(updateData),
        });

        // Build update object for SDK (SDK expects camelCase, converts to snake_case internally)
        const updates: Record<string, unknown> = {};

        // Contact information
        if (updateData.fName !== undefined) updates.fName = updateData.fName;
        if (updateData.lName !== undefined) updates.lName = updateData.lName;
        if (updateData.organization !== undefined) updates.organization = updateData.organization;
        if (updateData.email !== undefined) updates.email = updateData.email;

        // Phone numbers
        if (updateData.busPhone !== undefined) updates.busPhone = updateData.busPhone;
        if (updateData.homePhone !== undefined) updates.homePhone = updateData.homePhone;
        if (updateData.mobPhone !== undefined) updates.mobPhone = updateData.mobPhone;
        if (updateData.fax !== undefined) updates.fax = updateData.fax;

        // Note
        if (updateData.note !== undefined) updates.note = updateData.note;

        // Primary address
        if (updateData.pStreet !== undefined) updates.pStreet = updateData.pStreet;
        if (updateData.pStreet2 !== undefined) updates.pStreet2 = updateData.pStreet2;
        if (updateData.pCity !== undefined) updates.pCity = updateData.pCity;
        if (updateData.pProvince !== undefined) updates.pProvince = updateData.pProvince;
        if (updateData.pCode !== undefined) updates.pCode = updateData.pCode;
        if (updateData.pCountry !== undefined) updates.pCountry = updateData.pCountry;

        // Secondary address
        if (updateData.sStreet !== undefined) updates.sStreet = updateData.sStreet;
        if (updateData.sStreet2 !== undefined) updates.sStreet2 = updateData.sStreet2;
        if (updateData.sCity !== undefined) updates.sCity = updateData.sCity;
        if (updateData.sProvince !== undefined) updates.sProvince = updateData.sProvince;
        if (updateData.sCode !== undefined) updates.sCode = updateData.sCode;
        if (updateData.sCountry !== undefined) updates.sCountry = updateData.sCountry;

        // Financial settings
        if (updateData.currencyCode !== undefined) updates.currencyCode = updateData.currencyCode;
        if (updateData.language !== undefined) updates.language = updateData.language;
        if (updateData.vatNumber !== undefined) updates.vatNumber = updateData.vatNumber;
        if (updateData.vatName !== undefined) updates.vatName = updateData.vatName;

        // Billing preferences
        if (updateData.allowLateFees !== undefined) updates.allowLateFees = updateData.allowLateFees;
        if (updateData.allowLateNotifications !== undefined) {
          updates.allowLateNotifications = updateData.allowLateNotifications;
        }

        // Status
        if (updateData.visState !== undefined) updates.visState = updateData.visState;

        const result = await client.executeWithRetry(
          'client_update',
          async (fbClient) => {
            const response = await fbClient.clients.update(updates, accountId, String(clientId));

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { client: { ... } }
        const updatedClient = (result as { client?: unknown }).client ?? result;

        logger.info('Client updated successfully', {
          clientId,
        });

        return updatedClient as z.infer<typeof ClientSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
