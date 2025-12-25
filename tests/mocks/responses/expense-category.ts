/**
 * Mock ExpenseCategory Responses
 *
 * Factory functions for creating mock FreshBooks API responses for expense categories.
 */

/**
 * Create a mock expense category object
 */
export function createMockExpenseCategory(overrides: Partial<any> = {}): any {
  return {
    id: 12345,
    categoryid: 12345,
    category: 'Office Supplies',
    visState: 0,
    updated: '2024-01-15T10:00:00Z',
    is_cogs: false,
    is_editable: false,
    parentid: null,
    ...overrides,
  };
}

/**
 * Create a mock list response for expense categories
 */
export function mockExpenseCategoryListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): any {
  const categoryNames = [
    'Advertising',
    'Automobile Expenses',
    'Bank Charges',
    'Business Meals',
    'Computer Equipment',
    'Insurance',
    'Office Supplies',
    'Professional Fees',
    'Rent',
    'Telephone',
    'Travel',
    'Utilities',
  ];

  const categories = Array.from({ length: count }, (_, i) =>
    createMockExpenseCategory({
      id: 1000 + i,
      categoryid: 1000 + i,
      category: categoryNames[i % categoryNames.length],
    })
  );

  return {
    ok: true,
    data: {
      categories,
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
export function mockExpenseCategoryEmptyListResponse(): any {
  return {
    ok: true,
    data: {
      categories: [],
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
 * Create a mock single expense category response
 */
export function mockExpenseCategorySingleResponse(overrides: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      category: createMockExpenseCategory(overrides),
    },
  };
}

/**
 * Create a mock not found error
 */
export function mockExpenseCategoryNotFoundError(categoryId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Expense category with id ${categoryId} was not found`,
      statusCode: 404,
    },
  };
}
