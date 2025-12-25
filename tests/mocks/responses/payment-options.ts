/**
 * Mock responses for PaymentOptions entity
 */

/**
 * Create a mock payment options object
 */
export function createMockPaymentOptions(overrides: Record<string, unknown> = {}) {
  const entityId = (overrides.entityId as number) || 12345;
  const entityType = (overrides.entityType as 'invoice' | 'estimate') || 'invoice';

  return {
    id: overrides.id || 99999,
    entityId,
    entityType,
    gateway: overrides.gateway || 'stripe',
    hasAch: overrides.hasAch !== undefined ? overrides.hasAch : false,
    hasCreditCard: overrides.hasCreditCard !== undefined ? overrides.hasCreditCard : true,
    hasPaypalSmartCheckout: overrides.hasPaypalSmartCheckout !== undefined ? overrides.hasPaypalSmartCheckout : false,
    allowPartialPayments: overrides.allowPartialPayments !== undefined ? overrides.allowPartialPayments : false,
    gatewayInfo: overrides.gatewayInfo || {
      gateway: 'stripe',
      gatewayId: 'gw_123456',
    },
    ...overrides,
  };
}

/**
 * Create a mock default payment options object
 */
export function createMockDefaultPaymentOptions(overrides: Record<string, unknown> = {}) {
  return {
    gateway: overrides.gateway || 'stripe',
    hasAch: overrides.hasAch !== undefined ? overrides.hasAch : false,
    hasCreditCard: overrides.hasCreditCard !== undefined ? overrides.hasCreditCard : true,
    hasPaypalSmartCheckout: overrides.hasPaypalSmartCheckout !== undefined ? overrides.hasPaypalSmartCheckout : false,
    allowPartialPayments: overrides.allowPartialPayments !== undefined ? overrides.allowPartialPayments : false,
    ...overrides,
  };
}

/**
 * Mock response for single payment options
 */
export function mockPaymentOptionsSingleResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      paymentOptions: createMockPaymentOptions(overrides),
    },
  };
}

/**
 * Mock response for payment options create
 */
export function mockPaymentOptionsCreateResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      paymentOptions: createMockPaymentOptions({
        id: 99999,
        ...overrides,
      }),
    },
  };
}

/**
 * Mock response for default payment options
 */
export function mockPaymentOptionsDefaultResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      paymentOptions: createMockDefaultPaymentOptions(overrides),
    },
  };
}

/**
 * Mock not found error for payment options
 */
export function mockPaymentOptionsNotFoundError(entityId: number, entityType: string) {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Payment options for ${entityType} ${entityId} not found`,
      statusCode: 404,
    },
  };
}

/**
 * Mock validation error for payment options
 */
export function mockPaymentOptionsValidationError(field: string, message: string) {
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

/**
 * Mock invalid gateway error
 */
export function mockInvalidGatewayError(gateway: string) {
  return {
    ok: false,
    error: {
      code: 'INVALID_GATEWAY',
      message: `Payment gateway '${gateway}' is not configured or invalid`,
      statusCode: 400,
    },
  };
}

/**
 * Mock gateway not configured error
 */
export function mockGatewayNotConfiguredError() {
  return {
    ok: false,
    error: {
      code: 'GATEWAY_NOT_CONFIGURED',
      message: 'No payment gateway is configured for this account',
      statusCode: 400,
    },
  };
}

/**
 * Mock invalid entity type error
 */
export function mockInvalidEntityTypeError(entityType: string) {
  return {
    ok: false,
    error: {
      code: 'INVALID_ENTITY_TYPE',
      message: `Entity type '${entityType}' is not valid. Must be 'invoice' or 'estimate'`,
      statusCode: 400,
    },
  };
}

/**
 * Mock payment options with only credit card enabled
 */
export function mockPaymentOptionsCreditCardOnly(entityId: number = 12345) {
  return mockPaymentOptionsSingleResponse({
    entityId,
    hasCreditCard: true,
    hasAch: false,
    hasPaypalSmartCheckout: false,
    allowPartialPayments: false,
  });
}

/**
 * Mock payment options with only ACH enabled
 */
export function mockPaymentOptionsAchOnly(entityId: number = 12345) {
  return mockPaymentOptionsSingleResponse({
    entityId,
    hasCreditCard: false,
    hasAch: true,
    hasPaypalSmartCheckout: false,
    allowPartialPayments: false,
  });
}

/**
 * Mock payment options with all methods enabled
 */
export function mockPaymentOptionsAllEnabled(entityId: number = 12345) {
  return mockPaymentOptionsSingleResponse({
    entityId,
    hasCreditCard: true,
    hasAch: true,
    hasPaypalSmartCheckout: true,
    allowPartialPayments: true,
  });
}

/**
 * Mock payment options with PayPal
 */
export function mockPaymentOptionsWithPayPal(entityId: number = 12345) {
  return mockPaymentOptionsSingleResponse({
    entityId,
    gateway: 'paypal',
    hasCreditCard: false,
    hasAch: false,
    hasPaypalSmartCheckout: true,
    gatewayInfo: {
      gateway: 'paypal',
      gatewayId: 'paypal_12345',
    },
  });
}

/**
 * Mock payment options for estimate
 */
export function mockPaymentOptionsForEstimate(estimateId: number = 67890) {
  return mockPaymentOptionsSingleResponse({
    entityId: estimateId,
    entityType: 'estimate',
    hasCreditCard: true,
    hasAch: false,
  });
}
