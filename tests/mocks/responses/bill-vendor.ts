/**
 * Mock BillVendor Responses
 *
 * Factory functions for creating mock FreshBooks API responses for vendors.
 */

/**
 * Create a mock vendor object
 */
export function createMockVendor(overrides: Partial<any> = {}): any {
  return {
    id: 12345,
    vendorName: 'Acme Supplies Inc',
    contactName: 'John Smith',
    email: 'john@acmesupplies.com',
    phone: '555-123-4567',
    website: 'https://www.acmesupplies.com',
    address: '123 Main Street',
    city: 'New York',
    province: 'NY',
    postalCode: '10001',
    country: 'United States',
    currencyCode: 'USD',
    accountNumber: 'ACCT-001',
    taxNumber: '12-3456789',
    note: 'Primary office supplies vendor',
    is1099: false,
    language: 'en',
    visState: 0,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock list response for vendors
 */
export function mockVendorListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): any {
  const vendors = Array.from({ length: count }, (_, i) =>
    createMockVendor({
      id: 10000 + i,
      vendorName: `Vendor ${i + 1}`,
      email: `vendor${i + 1}@example.com`,
      currencyCode: i % 3 === 0 ? 'CAD' : 'USD',
    })
  );

  return {
    ok: true,
    data: {
      bill_vendors: vendors,
      pages: {
        page,
        pages: Math.ceil(count / perPage),
        perPage,
        per_page: perPage,
        total: count,
      },
    },
  };
}

/**
 * Create an empty list response
 */
export function mockVendorEmptyListResponse(): any {
  return {
    ok: true,
    data: {
      bill_vendors: [],
      pages: {
        page: 1,
        pages: 0,
        perPage: 30,
        per_page: 30,
        total: 0,
      },
    },
  };
}

/**
 * Create a mock single vendor response
 */
export function mockVendorSingleResponse(overrides: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      bill_vendor: createMockVendor(overrides),
    },
  };
}

/**
 * Create a mock create vendor response
 */
export function mockVendorCreateResponse(input: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      bill_vendor: createMockVendor({
        id: 99999,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...input,
      }),
    },
  };
}

/**
 * Create a mock update vendor response
 */
export function mockVendorUpdateResponse(id: number, updates: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      bill_vendor: createMockVendor({
        id,
        updatedAt: new Date().toISOString(),
        ...updates,
      }),
    },
  };
}

/**
 * Create a mock delete vendor response
 */
export function mockVendorDeleteResponse(): any {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Create a mock not found error
 */
export function mockVendorNotFoundError(vendorId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Vendor with id ${vendorId} was not found`,
      statusCode: 404,
    },
  };
}

/**
 * Create a mock validation error
 */
export function mockVendorValidationError(field: string, message: string): any {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `${field}: ${message}`,
      statusCode: 400,
    },
  };
}

/**
 * Create a mock conflict error (for vendors with associated bills)
 */
export function mockVendorHasBillsError(vendorId: number): any {
  return {
    ok: false,
    error: {
      code: 'CONFLICT',
      message: `Vendor ${vendorId} has associated bills and cannot be deleted`,
      statusCode: 409,
    },
  };
}

/**
 * Create a mock duplicate vendor error
 */
export function mockVendorDuplicateError(vendorName: string): any {
  return {
    ok: false,
    error: {
      code: 'DUPLICATE',
      message: `A vendor with the name '${vendorName}' already exists`,
      statusCode: 409,
    },
  };
}
