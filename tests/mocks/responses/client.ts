/**
 * Mock Client Responses
 *
 * Factory functions for creating mock FreshBooks API responses for clients.
 */

/**
 * Create a mock client object
 */
export function createMockClient(overrides: Partial<any> = {}): any {
  return {
    id: 12345,
    fName: 'John',
    lName: 'Doe',
    organization: 'Acme Corporation',
    email: 'john.doe@acme.com',
    busPhone: '555-123-4567',
    homePhone: null,
    mobPhone: '555-987-6543',
    fax: '',
    note: 'Important client',
    // Primary address
    pStreet: '123 Main Street',
    pStreet2: 'Suite 100',
    pCity: 'New York',
    pProvince: 'NY',
    pCode: '10001',
    pCountry: 'United States',
    // Secondary address
    sStreet: '',
    sStreet2: '',
    sCity: '',
    sProvince: '',
    sCode: '',
    sCountry: '',
    // Financial
    currencyCode: 'USD',
    language: 'en',
    vatNumber: null,
    vatName: null,
    visState: 0,
    signupDate: '2024-01-15T10:00:00Z',
    updated: '2024-01-15T10:00:00Z',
    // Billing preferences
    allowLateFees: true,
    allowLateNotifications: true,
    hasRetainer: null,
    retainerId: null,
    ...overrides,
  };
}

/**
 * Create a mock list response for clients
 */
export function mockClientListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): any {
  const clients = Array.from({ length: count }, (_, i) =>
    createMockClient({
      id: 10000 + i,
      fName: `Client${i + 1}`,
      lName: `Test`,
      organization: `Company ${i + 1}`,
      email: `client${i + 1}@example.com`,
    })
  );

  return {
    ok: true,
    data: {
      clients,
      pages: {
        page,
        pages: Math.ceil(count / perPage),
        perPage,
        total: count,
      },
    },
  };
}

/**
 * Create an empty list response
 */
export function mockClientEmptyListResponse(): any {
  return {
    ok: true,
    data: {
      clients: [],
      pages: {
        page: 1,
        pages: 0,
        perPage: 30,
        total: 0,
      },
    },
  };
}

/**
 * Create a mock single client response
 */
export function mockClientSingleResponse(overrides: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      client: createMockClient(overrides),
    },
  };
}

/**
 * Create a mock create client response
 */
export function mockClientCreateResponse(input: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      client: createMockClient({
        id: 99999,
        signupDate: new Date().toISOString(),
        updated: new Date().toISOString(),
        ...input,
      }),
    },
  };
}

/**
 * Create a mock update client response
 */
export function mockClientUpdateResponse(clientId: number, updates: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      client: createMockClient({
        id: clientId,
        updated: new Date().toISOString(),
        ...updates,
      }),
    },
  };
}

/**
 * Create a mock delete client response
 */
export function mockClientDeleteResponse(): any {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Create a mock not found error
 */
export function mockClientNotFoundError(clientId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Client with id ${clientId} was not found`,
      statusCode: 404,
    },
  };
}

/**
 * Create a mock duplicate email error
 */
export function mockClientDuplicateEmailError(email: string): any {
  return {
    ok: false,
    error: {
      code: 'DUPLICATE_ENTRY',
      message: `A client with email ${email} already exists`,
      statusCode: 409,
    },
  };
}
