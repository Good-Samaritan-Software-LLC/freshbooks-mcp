/**
 * Mock responses for OtherIncome entity
 */

/**
 * Create a mock other income object
 */
export function createMockOtherIncome(overrides: Record<string, unknown> = {}) {
  const id = (overrides.incomeId as number) || 12345;
  return {
    incomeId: id,
    amount: overrides.amount || { amount: '500.00', code: 'USD' },
    categoryName: overrides.categoryName || 'Interest Income',
    createdAt: overrides.createdAt || '2024-01-15T10:00:00Z',
    date: overrides.date || '2024-01-15T00:00:00Z',
    note: overrides.note !== undefined ? overrides.note : 'Bank interest payment',
    paymentType: overrides.paymentType || 'Bank Transfer',
    source: overrides.source !== undefined ? overrides.source : 'TD Bank',
    taxes: overrides.taxes || [],
    updated: overrides.updated || '2024-01-15T10:00:00Z',
    visState: overrides.visState !== undefined ? overrides.visState : 0,
    ...overrides,
  };
}

/**
 * Mock response for other income list
 */
export function mockOtherIncomeListResponse(
  count: number = 5,
  page: number = 1,
  perPage: number = 30
) {
  const otherIncomes = Array.from({ length: count }, (_, i) =>
    createMockOtherIncome({
      incomeId: 12345 + i,
      categoryName: i % 3 === 0 ? 'Interest Income' : i % 3 === 1 ? 'Dividend Income' : 'Rebates',
      amount: { amount: `${(i + 1) * 100}.00`, code: 'USD' },
      source: i % 2 === 0 ? 'TD Bank' : 'Investment Account',
    })
  );

  return {
    ok: true,
    data: {
      other_incomes: otherIncomes,
      pages: {
        page,
        pages: Math.ceil(count / perPage),
        per_page: perPage,
        total: count,
      },
    },
  };
}

/**
 * Mock response for empty other income list
 */
export function mockOtherIncomeEmptyListResponse() {
  return {
    ok: true,
    data: {
      other_incomes: [],
      pages: {
        page: 1,
        pages: 1,
        per_page: 30,
        total: 0,
      },
    },
  };
}

/**
 * Mock response for single other income
 */
export function mockOtherIncomeSingleResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      other_income: createMockOtherIncome(overrides),
    },
  };
}

/**
 * Mock response for other income create
 */
export function mockOtherIncomeCreateResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      other_income: createMockOtherIncome({
        incomeId: 99999,
        createdAt: new Date().toISOString(),
        updated: new Date().toISOString(),
        ...overrides,
      }),
    },
  };
}

/**
 * Mock response for other income update
 */
export function mockOtherIncomeUpdateResponse(
  incomeId: number,
  updates: Record<string, unknown> = {}
) {
  return {
    ok: true,
    data: {
      other_income: createMockOtherIncome({
        incomeId,
        updated: new Date().toISOString(),
        ...updates,
      }),
    },
  };
}

/**
 * Mock response for other income delete
 */
export function mockOtherIncomeDeleteResponse() {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Mock not found error
 */
export function mockOtherIncomeNotFoundError(incomeId: number) {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Other income ${incomeId} not found`,
      statusCode: 404,
    },
  };
}

/**
 * Mock validation error
 */
export function mockOtherIncomeValidationError(field: string, message: string) {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `Validation error: ${field} - ${message}`,
      statusCode: 400,
      details: {
        field,
        message,
      },
    },
  };
}
