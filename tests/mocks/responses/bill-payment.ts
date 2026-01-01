/**
 * Mock BillPayment Responses
 *
 * Factory functions for creating mock FreshBooks API responses for bill payments.
 */

/**
 * Create a mock bill payment object
 */
export function createMockBillPayment(overrides: Partial<any> = {}): any {
  return {
    id: 12345,
    billId: 5001,
    amount: {
      amount: '500.00',
      code: 'USD',
    },
    paymentType: 'check',
    paidDate: '2024-01-20T00:00:00Z',
    note: 'Payment for January bill',
    matchedWithExpense: false,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock list response for bill payments
 */
export function mockBillPaymentListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): any {
  const paymentTypes = ['check', 'credit', 'cash', 'bank_transfer', 'debit', 'other'];

  const billPayments = Array.from({ length: count }, (_, i) =>
    createMockBillPayment({
      id: 10000 + i,
      billId: 5000 + (i % 5),
      amount: {
        amount: String((i + 1) * 100) + '.00',
        code: 'USD',
      },
      paymentType: paymentTypes[i % paymentTypes.length],
      paidDate: `2024-01-${String((i % 28) + 1).padStart(2, '0')}T00:00:00Z`,
    })
  );

  return {
    ok: true,
    data: {
      bill_payments: billPayments,
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
export function mockBillPaymentEmptyListResponse(): any {
  return {
    ok: true,
    data: {
      bill_payments: [],
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
 * Create a mock single bill payment response
 */
export function mockBillPaymentSingleResponse(overrides: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      bill_payment: createMockBillPayment(overrides),
    },
  };
}

/**
 * Create a mock create bill payment response
 */
export function mockBillPaymentCreateResponse(input: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      bill_payment: createMockBillPayment({
        id: 99999,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...input,
      }),
    },
  };
}

/**
 * Create a mock update bill payment response
 */
export function mockBillPaymentUpdateResponse(id: number, updates: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      bill_payment: createMockBillPayment({
        id,
        updatedAt: new Date().toISOString(),
        ...updates,
      }),
    },
  };
}

/**
 * Create a mock delete bill payment response
 */
export function mockBillPaymentDeleteResponse(): any {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Create a mock not found error
 */
export function mockBillPaymentNotFoundError(billPaymentId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Bill payment with id ${billPaymentId} was not found`,
      statusCode: 404,
    },
  };
}

/**
 * Create a mock validation error
 */
export function mockBillPaymentValidationError(field: string, message: string): any {
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
 * Create a mock bill not found error
 */
export function mockBillNotFoundForPaymentError(billId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Bill with id ${billId} was not found`,
      statusCode: 404,
    },
  };
}
