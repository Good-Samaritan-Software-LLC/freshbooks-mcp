/**
 * Mock Expense Responses
 *
 * Factory functions for creating mock FreshBooks API responses for expenses.
 */

/**
 * Create a mock expense object
 */
export function createMockExpense(overrides: Partial<any> = {}): any {
  return {
    id: 12345,
    accountId: 'ABC123',
    amount: {
      amount: '150.00',
      code: 'USD',
    },
    date: '2024-01-15T00:00:00Z',
    categoryId: 5678,
    staffId: 1,
    vendor: 'Office Depot',
    notes: 'Office supplies for Q1',
    clientId: null,
    projectId: null,
    markupPercent: 0,
    taxName1: null,
    taxPercent1: null,
    taxName2: null,
    taxPercent2: null,
    taxAmount1: null,
    taxAmount2: null,
    isDuplicate: false,
    profileId: null,
    invoiceId: null,
    visState: 0,
    status: 'outstanding',
    bankName: null,
    updated: '2024-01-15T10:00:00Z',
    hasReceipt: false,
    backgroundJobId: null,
    extSystemId: null,
    ...overrides,
  };
}

/**
 * Create a mock list response for expenses
 */
export function mockExpenseListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): any {
  const expenses = Array.from({ length: count }, (_, i) =>
    createMockExpense({
      id: 10000 + i,
      categoryId: 5000 + (i % 5),
      vendor: `Vendor ${i + 1}`,
      amount: {
        amount: String((i + 1) * 50) + '.00',
        code: 'USD',
      },
    })
  );

  return {
    ok: true,
    data: {
      expenses,
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
export function mockExpenseEmptyListResponse(): any {
  return {
    ok: true,
    data: {
      expenses: [],
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
 * Create a mock single expense response
 */
export function mockExpenseSingleResponse(overrides: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      expense: createMockExpense(overrides),
    },
  };
}

/**
 * Create a mock create expense response
 */
export function mockExpenseCreateResponse(input: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      expense: createMockExpense({
        id: 99999,
        updated: new Date().toISOString(),
        ...input,
      }),
    },
  };
}

/**
 * Create a mock update expense response
 */
export function mockExpenseUpdateResponse(expenseId: number, updates: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      expense: createMockExpense({
        id: expenseId,
        updated: new Date().toISOString(),
        ...updates,
      }),
    },
  };
}

/**
 * Create a mock delete expense response
 */
export function mockExpenseDeleteResponse(): any {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Create a mock not found error
 */
export function mockExpenseNotFoundError(expenseId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Expense with id ${expenseId} was not found`,
      statusCode: 404,
    },
  };
}

/**
 * Create a mock validation error
 */
export function mockExpenseValidationError(field: string, message: string): any {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `${field}: ${message}`,
      statusCode: 400,
    },
  };
}
