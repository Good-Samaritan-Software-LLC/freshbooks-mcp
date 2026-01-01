/**
 * Mock Item Responses
 *
 * Factory functions for creating mock FreshBooks API responses for items.
 */

/**
 * Create a mock item object
 */
export function createMockItem(overrides: Partial<any> = {}): any {
  return {
    id: 12345,
    accountingSystemId: 'ABC123',
    name: 'Consulting Service',
    description: 'Professional consulting services',
    type: 'service',
    rate: {
      amount: '150.00',
      code: 'USD',
    },
    quantity: 1,
    taxable: true,
    tax1: null,
    tax2: null,
    inventory: null,
    sku: null,
    visState: 0,
    updated: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock list response for items
 */
export function mockItemListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): any {
  const itemNames = [
    'Consulting Service',
    'Web Development',
    'Design Services',
    'Project Management',
    'Technical Support',
    'Training Session',
    'Software License',
    'Monthly Retainer',
    'Hardware Widget',
    'Premium Package',
  ];

  const items = Array.from({ length: count }, (_, i) =>
    createMockItem({
      id: 10000 + i,
      name: itemNames[i % itemNames.length],
      rate: {
        amount: String((i + 1) * 50) + '.00',
        code: 'USD',
      },
      type: i % 3 === 0 ? 'product' : 'service',
    })
  );

  return {
    ok: true,
    data: {
      items,
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
export function mockItemEmptyListResponse(): any {
  return {
    ok: true,
    data: {
      items: [],
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
 * Create a mock single item response
 */
export function mockItemSingleResponse(overrides: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      item: createMockItem(overrides),
    },
  };
}

/**
 * Create a mock create item response
 */
export function mockItemCreateResponse(input: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      item: createMockItem({
        id: 99999,
        updated: new Date().toISOString(),
        ...input,
      }),
    },
  };
}

/**
 * Create a mock update item response
 */
export function mockItemUpdateResponse(itemId: number, updates: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      item: createMockItem({
        id: itemId,
        updated: new Date().toISOString(),
        ...updates,
      }),
    },
  };
}

/**
 * Create a mock not found error
 */
export function mockItemNotFoundError(itemId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Item with id ${itemId} was not found`,
      statusCode: 404,
    },
  };
}

/**
 * Create a mock validation error
 */
export function mockItemValidationError(field: string, message: string): any {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `${field}: ${message}`,
      statusCode: 400,
    },
  };
}
