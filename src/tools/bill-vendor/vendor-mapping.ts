/**
 * MCP <-> SDK field mapping for bill vendors (audit F3).
 *
 * The MCP schemas advertise user-friendly fields (contactName, email, address)
 * but the SDK request transform (transformBillVendorsRequest) only maps
 * primaryContactFirstName/LastName, primaryContactEmail and street — so those
 * inputs were silently dropped (validated, accepted, never sent). These
 * helpers translate in both directions so the advertised fields actually work.
 *
 * There is deliberately no taxNumber mapping: live-verified (2026-06-04) that
 * the bill_vendor wire object has no tax-number scalar at all (tax_defaults[]
 * is default tax RATES — taxId/taxAuthorityid — not a VAT/registration
 * number). The field has been removed from the input schemas entirely.
 */

/**
 * Map MCP-friendly vendor input fields onto SDK request-model fields.
 * Non-mapped fields pass through unchanged.
 */
export function mapVendorInputToSdk(data: Record<string, unknown>): Record<string, unknown> {
  const { contactName, email, address, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest };
  if (email !== undefined) {
    payload.primaryContactEmail = email;
  }
  if (typeof contactName === 'string' && contactName.trim().length > 0) {
    const parts = contactName.trim().split(/\s+/);
    payload.primaryContactFirstName = parts[0];
    if (parts.length > 1) {
      payload.primaryContactLastName = parts.slice(1).join(' ');
    }
  }
  if (address !== undefined) {
    payload.street = address;
  }
  return payload;
}

/**
 * Surface SDK response fields under the MCP-advertised names.
 * Keeps the SDK fields too, so nothing is lost.
 */
export function mapVendorOutputToMcp<T>(vendor: T): T {
  if (!vendor || typeof vendor !== 'object') return vendor;
  const v = vendor as Record<string, unknown>;
  const nameParts = [v.primaryContactFirstName, v.primaryContactLastName].filter(
    (s): s is string => typeof s === 'string' && s.length > 0
  );
  return {
    ...v,
    contactName: nameParts.length > 0 ? nameParts.join(' ') : (v.contactName ?? null),
    email: v.primaryContactEmail ?? v.email ?? null,
    address: v.street ?? v.address ?? null,
  } as T;
}
