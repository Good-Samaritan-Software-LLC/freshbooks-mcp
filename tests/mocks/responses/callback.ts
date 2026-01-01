/**
 * Mock responses for Callback (Webhook) entity
 */

/**
 * Create a mock callback object
 */
export function createMockCallback(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as number) || 12345;
  return {
    id,
    event: overrides.event || 'invoice.create',
    uri: overrides.uri || 'https://example.com/webhooks',
    verified: overrides.verified ?? false,
    createdAt: overrides.createdAt || '2024-01-15T10:00:00Z',
    updatedAt: overrides.updatedAt || '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Mock response for callback list
 */
export function mockCallbackListResponse(
  count: number = 5,
  page: number = 1,
  perPage: number = 30
) {
  const callbacks = Array.from({ length: count }, (_, i) =>
    createMockCallback({
      id: 12345 + i,
      event: i % 3 === 0 ? 'invoice.create' : i % 3 === 1 ? 'payment.create' : 'time_entry.create',
      uri: `https://example.com/webhooks/${12345 + i}`,
      verified: i % 2 === 0,
    })
  );

  return {
    ok: true,
    data: {
      callbacks,
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
 * Mock response for empty callback list
 */
export function mockCallbackEmptyListResponse() {
  return {
    ok: true,
    data: {
      callbacks: [],
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
 * Mock response for single callback
 */
export function mockCallbackSingleResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      callback: createMockCallback(overrides),
    },
  };
}

/**
 * Mock response for callback create
 */
export function mockCallbackCreateResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      callback: createMockCallback({
        id: 99999,
        verified: false,
        ...overrides,
      }),
    },
  };
}

/**
 * Mock response for callback update
 */
export function mockCallbackUpdateResponse(
  callbackId: number,
  updates: Record<string, unknown> = {}
) {
  return {
    ok: true,
    data: {
      callback: createMockCallback({
        id: callbackId,
        updatedAt: new Date().toISOString(),
        ...updates,
      }),
    },
  };
}

/**
 * Mock response for callback delete
 */
export function mockCallbackDeleteResponse() {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Mock response for callback verify
 */
export function mockCallbackVerifyResponse(callbackId: number, verified: boolean = true) {
  return {
    ok: true,
    data: {
      callback: createMockCallback({
        id: callbackId,
        verified,
        updatedAt: new Date().toISOString(),
      }),
    },
  };
}

/**
 * Mock response for resend verification
 */
export function mockCallbackResendVerificationResponse(callbackId: number) {
  return {
    ok: true,
    data: {
      callback: createMockCallback({
        id: callbackId,
        verified: false,
        updatedAt: new Date().toISOString(),
      }),
    },
  };
}

/**
 * Mock not found error
 */
export function mockCallbackNotFoundError(callbackId: number) {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Callback ${callbackId} not found`,
      statusCode: 404,
    },
  };
}

/**
 * Mock validation error
 */
export function mockCallbackValidationError(field: string, message: string) {
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
 * Mock invalid URI error (non-HTTPS)
 */
export function mockCallbackInvalidURIError() {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Webhook URI must use HTTPS protocol',
      statusCode: 400,
    },
  };
}

/**
 * Mock invalid verifier error
 */
export function mockCallbackInvalidVerifierError() {
  return {
    ok: false,
    error: {
      code: 'INVALID_VERIFIER',
      message: 'Invalid verification code',
      statusCode: 400,
    },
  };
}

/**
 * Mock already verified error
 */
export function mockCallbackAlreadyVerifiedError(callbackId: number) {
  return {
    ok: false,
    error: {
      code: 'ALREADY_VERIFIED',
      message: `Callback ${callbackId} is already verified`,
      statusCode: 400,
    },
  };
}

/**
 * Mock unreachable endpoint error
 */
export function mockCallbackUnreachableEndpointError(uri: string) {
  return {
    ok: false,
    error: {
      code: 'UNREACHABLE_ENDPOINT',
      message: `Unable to reach webhook endpoint at ${uri}`,
      statusCode: 400,
    },
  };
}

/**
 * Mock duplicate callback error
 */
export function mockCallbackDuplicateError(event: string) {
  return {
    ok: false,
    error: {
      code: 'CONFLICT',
      message: `Callback for event ${event} already exists`,
      statusCode: 409,
    },
  };
}
