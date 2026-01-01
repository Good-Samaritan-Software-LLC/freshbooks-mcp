/**
 * Mock FreshBooks Error Responses
 *
 * Factory functions for creating various error scenarios.
 */

/**
 * Create a mock unauthorized error (401)
 */
export function mockUnauthorizedError(): any {
  return {
    ok: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired access token',
      statusCode: 401,
    },
  };
}

/**
 * Create a mock forbidden error (403)
 */
export function mockForbiddenError(resource: string = 'resource'): any {
  return {
    ok: false,
    error: {
      code: 'FORBIDDEN',
      message: `Access denied to ${resource}`,
      statusCode: 403,
    },
  };
}

/**
 * Create a mock not found error (404)
 */
export function mockNotFoundError(resourceType: string, resourceId: string | number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `${resourceType} with id ${resourceId} was not found`,
      statusCode: 404,
    },
  };
}

/**
 * Create a mock rate limit error (429)
 */
export function mockRateLimitError(retryAfter: number = 60): any {
  return {
    ok: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: 429,
      retryAfter,
    },
  };
}

/**
 * Create a mock validation error (422)
 */
export function mockValidationError(field: string, message: string): any {
  return {
    ok: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `Validation failed: ${message}`,
      statusCode: 422,
      field, // Direct access to field for convenience
      errors: [
        {
          field,
          message,
        },
      ],
    },
  };
}

/**
 * Create a mock conflict error (409)
 */
export function mockConflictError(resourceType: string, field: string): any {
  return {
    ok: false,
    error: {
      code: 'CONFLICT',
      message: `${resourceType} with this ${field} already exists`,
      statusCode: 409,
    },
  };
}

/**
 * Create a mock server error (500)
 */
export function mockServerError(): any {
  return {
    ok: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred',
      statusCode: 500,
    },
  };
}

/**
 * Create a mock service unavailable error (503)
 */
export function mockServiceUnavailableError(): any {
  return {
    ok: false,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable',
      statusCode: 503,
    },
  };
}

/**
 * Create a mock network timeout error
 */
export function mockNetworkTimeoutError(): Error {
  const error = new Error('Request timeout');
  (error as any).code = 'ETIMEDOUT';
  return error;
}

/**
 * Create a mock network connection error
 */
export function mockNetworkConnectionError(): Error {
  const error = new Error('Connection refused');
  (error as any).code = 'ECONNREFUSED';
  return error;
}

/**
 * Create a mock bad request error (400)
 */
export function mockBadRequestError(message: string = 'Bad request'): any {
  return {
    ok: false,
    error: {
      code: 'BAD_REQUEST',
      message,
      statusCode: 400,
    },
  };
}

/**
 * Create a mock required field error
 */
export function mockRequiredFieldError(field: string): any {
  return mockValidationError(field, `${field} is required`);
}

/**
 * Create a mock invalid value error
 */
export function mockInvalidValueError(field: string, value: unknown): any {
  return mockValidationError(field, `Invalid value for ${field}: ${String(value)}`);
}

/**
 * Create a mock invalid type error
 */
export function mockInvalidTypeError(field: string, expected: string, actual: string): any {
  return mockValidationError(field, `${field} must be ${expected}, got ${actual}`);
}

/**
 * Create a mock out of range error
 */
export function mockOutOfRangeError(field: string, min?: number, max?: number): any {
  let message = `${field} is out of range`;
  if (min !== undefined && max !== undefined) {
    message = `${field} must be between ${min} and ${max}`;
  } else if (min !== undefined) {
    message = `${field} must be at least ${min}`;
  } else if (max !== undefined) {
    message = `${field} must be at most ${max}`;
  }
  return mockValidationError(field, message);
}

/**
 * Create a mock invalid account error
 */
export function mockInvalidAccountError(accountId: string): any {
  return {
    ok: false,
    error: {
      code: 'INVALID_ACCOUNT',
      message: `Account ${accountId} is invalid or inaccessible`,
      statusCode: 403,
    },
  };
}

/**
 * Create a mock resource locked error
 */
export function mockResourceLockedError(entity: string, id: number | string): any {
  return {
    ok: false,
    error: {
      code: 'RESOURCE_LOCKED',
      message: `${entity} ${id} is currently locked by another process`,
      statusCode: 423,
    },
  };
}

/**
 * Create a mock immutable resource error
 */
export function mockImmutableResourceError(entity: string): any {
  return {
    ok: false,
    error: {
      code: 'IMMUTABLE_RESOURCE',
      message: `${entity} cannot be modified. Create a new one instead.`,
      statusCode: 405,
    },
  };
}

/**
 * Create a mock archived resource error
 */
export function mockArchivedResourceError(entity: string, id: number | string): any {
  return {
    ok: false,
    error: {
      code: 'ARCHIVED_RESOURCE',
      message: `${entity} ${id} is archived and cannot be used`,
      statusCode: 410,
    },
  };
}

/**
 * Create a mock deleted resource error
 */
export function mockDeletedResourceError(entity: string, id: number | string): any {
  return {
    ok: false,
    error: {
      code: 'DELETED_RESOURCE',
      message: `${entity} ${id} has been deleted`,
      statusCode: 410,
    },
  };
}

/**
 * Create a mock business logic error
 */
export function mockBusinessLogicError(message: string): any {
  return {
    ok: false,
    error: {
      code: 'BUSINESS_LOGIC_ERROR',
      message,
      statusCode: 422,
    },
  };
}

/**
 * Create a mock concurrent timer error
 */
export function mockConcurrentTimerError(): any {
  return mockBusinessLogicError("Cannot start a new timer while another timer is running");
}

/**
 * Create a mock no active timer error
 */
export function mockNoActiveTimerError(): any {
  return mockBusinessLogicError("No active timer to stop");
}

/**
 * Create a mock invalid state transition error
 */
export function mockInvalidStateTransitionError(from: string, to: string): any {
  return mockBusinessLogicError(`Cannot transition from ${from} to ${to}`);
}
