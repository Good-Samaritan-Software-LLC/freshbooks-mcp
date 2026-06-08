/**
 * Tests for the MCP <-> SDK vendor field mapping (audit F3).
 *
 * Before this mapping existed, contactName/email/address were validated and
 * accepted by the input schemas but silently dropped by the SDK request
 * transform (transformBillVendorsRequest has no keys for them).
 */
import { describe, it, expect } from 'vitest';
import {
  mapVendorInputToSdk,
  mapVendorOutputToMcp,
} from '../../../src/tools/bill-vendor/vendor-mapping.js';

describe('mapVendorInputToSdk', () => {
  it('maps email to primaryContactEmail', () => {
    const out = mapVendorInputToSdk({ vendorName: 'V', email: 'a@b.com' });
    expect(out.primaryContactEmail).toBe('a@b.com');
    expect(out.email).toBeUndefined();
  });

  it('splits contactName into primaryContactFirstName/LastName', () => {
    const out = mapVendorInputToSdk({ contactName: 'Ada Quality Lovelace' });
    expect(out.primaryContactFirstName).toBe('Ada');
    expect(out.primaryContactLastName).toBe('Quality Lovelace');
    expect(out.contactName).toBeUndefined();
  });

  it('handles single-word contactName (no last name sent)', () => {
    const out = mapVendorInputToSdk({ contactName: 'Cher' });
    expect(out.primaryContactFirstName).toBe('Cher');
    expect(out.primaryContactLastName).toBeUndefined();
  });

  it('maps address to street', () => {
    const out = mapVendorInputToSdk({ address: '1 Main St' });
    expect(out.street).toBe('1 Main St');
    expect(out.address).toBeUndefined();
  });

  // taxNumber no longer exists in the input schemas (the API has no such wire
  // field); the schema strips it before the mapper ever runs — see the
  // 'taxNumber is no longer advertised' guard in transform-allowlist.guard.test.ts.

  it('passes through unrelated fields unchanged', () => {
    const out = mapVendorInputToSdk({ vendorName: 'V', city: 'Town', is1099: true });
    expect(out).toMatchObject({ vendorName: 'V', city: 'Town', is1099: true });
  });
});

describe('mapVendorOutputToMcp', () => {
  it('surfaces primaryContact*/street under the MCP-advertised names', () => {
    const out = mapVendorOutputToMcp({
      vendorId: 1,
      primaryContactFirstName: 'Ada',
      primaryContactLastName: 'Lovelace',
      primaryContactEmail: 'a@b.com',
      street: '1 Main St',
    }) as Record<string, unknown>;
    expect(out.contactName).toBe('Ada Lovelace');
    expect(out.email).toBe('a@b.com');
    expect(out.address).toBe('1 Main St');
    // SDK originals preserved
    expect(out.primaryContactEmail).toBe('a@b.com');
  });

  it('nulls the advertised fields when the SDK fields are absent', () => {
    const out = mapVendorOutputToMcp({ vendorId: 1 }) as Record<string, unknown>;
    expect(out.contactName).toBeNull();
    expect(out.email).toBeNull();
    expect(out.address).toBeNull();
  });

  it('keeps pre-existing MCP-shaped values (mock/test compatibility)', () => {
    const out = mapVendorOutputToMcp({
      vendorId: 1,
      contactName: 'Existing Name',
      email: 'kept@x.com',
      address: 'Kept St',
    }) as Record<string, unknown>;
    expect(out.contactName).toBe('Existing Name');
    expect(out.email).toBe('kept@x.com');
    expect(out.address).toBe('Kept St');
  });

  it('passes through non-object values', () => {
    expect(mapVendorOutputToMcp(null)).toBeNull();
    expect(mapVendorOutputToMcp(undefined)).toBeUndefined();
  });
});
