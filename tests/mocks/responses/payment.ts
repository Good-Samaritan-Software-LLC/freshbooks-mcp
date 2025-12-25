/**
 * Mock Payment Responses
 *
 * Factory functions for creating mock FreshBooks API responses for payments.
 */

/**
 * Create a mock payment object
 */
export function createMockPayment(overrides: Partial<any> = {}): any {
  return {
    id: 12345,
    invoiceId: 56789,
    accountId: 'ABC123',
    amount: {
      amount: '500.00',
      code: 'USD',
    },
    date: '2024-01-15T00:00:00Z',
    type: 'Credit Card',
    note: 'Payment received via Stripe',
    clientId: 11111,
    visState: 0,
    logId: 99999,
    updated: '2024-01-15T10:00:00Z',
    creditId: null,
    overpaymentId: null,
    gateway: 'stripe',
    fromCredit: false,
    sendEmailReceipt: false,
    ...overrides,
  };
}

/**
 * Create a mock list response for payments
 */
export function mockPaymentListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): any {
  const payments = Array.from({ length: count }, (_, i) =>
    createMockPayment({
      id: 10000 + i,
      invoiceId: 50000 + i,
      clientId: 20000 + i,
      amount: {
        amount: String((i + 1) * 100) + '.00',
        code: 'USD',
      },
    })
  );

  return {
    ok: true,
    data: {
      payments,
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
export function mockPaymentEmptyListResponse(): any {
  return {
    ok: true,
    data: {
      payments: [],
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
 * Create a mock single payment response
 */
export function mockPaymentSingleResponse(overrides: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      payment: createMockPayment(overrides),
    },
  };
}

/**
 * Create a mock create payment response
 */
export function mockPaymentCreateResponse(input: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      payment: createMockPayment({
        id: 99999,
        date: new Date().toISOString(),
        updated: new Date().toISOString(),
        ...input,
      }),
    },
  };
}

/**
 * Create a mock update payment response
 */
export function mockPaymentUpdateResponse(paymentId: number, updates: Partial<any> = {}): any {
  return {
    ok: true,
    data: {
      payment: createMockPayment({
        id: paymentId,
        updated: new Date().toISOString(),
        ...updates,
      }),
    },
  };
}

/**
 * Create a mock delete payment response
 */
export function mockPaymentDeleteResponse(): any {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Create a mock not found error
 */
export function mockPaymentNotFoundError(paymentId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Payment with id ${paymentId} was not found`,
      statusCode: 404,
    },
  };
}

/**
 * Create a mock validation error
 */
export function mockPaymentValidationError(field: string, message: string): any {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `${field}: ${message}`,
      statusCode: 400,
    },
  };
}
