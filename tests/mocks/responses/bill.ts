/**
 * Mock Bill Responses
 *
 * Factory functions for creating mock FreshBooks API responses for bills.
 */

/**
 * Create a mock bill object
 */
export function createMockBill(overrides: Partial<any> = {}): any {
  return {
    id: 12345,
    billNumber: 'BILL-001',
    vendorId: 5001,
    amount: {
      amount: '1500.00',
      code: 'USD',
    },
    outstandingAmount: {
      amount: '1500.00',
      code: 'USD',
    },
    paidAmount: {
      amount: '0.00',
      code: 'USD',
    },
    dueDate: '2024-02-15T00:00:00Z',
    issueDate: '2024-01-15T00:00:00Z',
    status: 'unpaid',
    lines: [
      {
        description: 'Office supplies',
        amount: { amount: '1500.00', code: 'USD' },
        quantity: 1,
      },
    ],
    notes: 'Monthly supplies invoice',
    attachment: null,
    taxAmount: {
      amount: '0.00',
      code: 'USD',
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    visState: 0,
    ...overrides,
  };
}

/**
 * Create a mock list response for bills
 */
export function mockBillListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): any {
  const statuses = ['unpaid', 'partial', 'paid', 'overdue'];

  const bills = Array.from({ length: count }, (_, i) =>
    createMockBill({
      id: 10000 + i,
      billNumber: `BILL-${String(i + 1).padStart(3, '0')}`,
      vendorId: 5000 + (i % 5),
      amount: {
        amount: String((i + 1) * 100) + '.00',
        code: 'USD',
      },
      status: statuses[i % statuses.length],
      issueDate: `2024-01-${String((i % 28) + 1).padStart(2, '0')}T00:00:00Z`,
    })
  );

  return {
    ok: true,
    data: {
      bills,
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
export function mockBillEmptyListResponse(): any {
  return {
    ok: true,
    data: {
      bills: [],
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
 * Create a mock single bill response
 */
export function mockBillSingleResponse(overrides: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      bill: createMockBill(overrides),
    },
  };
}

/**
 * Create a mock create bill response
 */
export function mockBillCreateResponse(input: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      bill: createMockBill({
        id: 99999,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...input,
      }),
    },
  };
}

/**
 * Create a mock delete bill response
 */
export function mockBillDeleteResponse(): any {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Create a mock archive bill response
 */
export function mockBillArchiveResponse(billId: number): any {
  return {
    ok: true,
    data: {
      bill: createMockBill({
        id: billId,
        visState: 2, // archived
        updatedAt: new Date().toISOString(),
      }),
    },
  };
}

/**
 * Create a mock not found error
 */
export function mockBillNotFoundError(billId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Bill with id ${billId} was not found`,
      statusCode: 404,
    },
  };
}

/**
 * Create a mock validation error
 */
export function mockBillValidationError(field: string, message: string): any {
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
 * Create a mock payment conflict error (for bills with payments)
 */
export function mockBillPaymentConflictError(billId: number): any {
  return {
    ok: false,
    error: {
      code: 'CONFLICT',
      message: `Bill ${billId} has payments and cannot be deleted`,
      statusCode: 409,
    },
  };
}
