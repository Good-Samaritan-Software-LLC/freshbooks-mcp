/**
 * Mock FreshBooks Client
 *
 * Creates mock client instances for testing.
 */

import { vi } from 'vitest';

/**
 * Mock FreshBooks Client structure
 */
export interface MockFreshBooksClient {
  timeEntries: {
    list: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  projects: {
    list: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  services: {
    list: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    rate: {
      single: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  tasks: {
    list: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  users: {
    me: ReturnType<typeof vi.fn>;
  };
}

/**
 * Mock FreshBooks Client Wrapper
 */
export interface MockFreshBooksClientWrapper {
  executeWithRetry: ReturnType<typeof vi.fn>;
  executeRawWithRetry: ReturnType<typeof vi.fn>;
  setAccountId: ReturnType<typeof vi.fn>;
  getAccountId: ReturnType<typeof vi.fn>;
}

/**
 * Create a mock FreshBooks client for testing
 */
export function createMockFreshBooksClient(): MockFreshBooksClient {
  return {
    timeEntries: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projects: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    services: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      rate: {
        single: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
    tasks: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    users: {
      me: vi.fn(),
    },
  };
}

/**
 * Create a mock FreshBooks Client Wrapper
 */
export function createMockClientWrapper(): MockFreshBooksClientWrapper {
  const mockClient = createMockFreshBooksClient();

  return {
    executeWithRetry: vi.fn(async (operation: string, apiCall: (client: MockFreshBooksClient) => Promise<any>) => {
      return apiCall(mockClient);
    }),
    executeRawWithRetry: vi.fn(),
    setAccountId: vi.fn(),
    getAccountId: vi.fn().mockReturnValue('ABC123'),
  };
}

/**
 * Setup a mock response for a specific method
 *
 * @param mockClient - The mock client
 * @param resource - Resource name (e.g., 'timeEntries')
 * @param method - Method name (e.g., 'list', 'create')
 * @param response - Response to return
 */
export function setupMockResponse(
  mockClient: MockFreshBooksClient,
  resource: keyof MockFreshBooksClient,
  method: string,
  response: any
): void {
  const resourceMock = mockClient[resource] as any;
  if (resourceMock && typeof resourceMock[method] === 'function') {
    if (response instanceof Error) {
      resourceMock[method].mockRejectedValueOnce(response);
    } else {
      resourceMock[method].mockResolvedValueOnce(response);
    }
  }
}

/**
 * Setup a mock implementation for executeWithRetry
 *
 * @param wrapper - Mock client wrapper
 * @param implementation - Implementation function
 */
export function setupExecuteWithRetry(
  wrapper: MockFreshBooksClientWrapper,
  implementation: (operation: string, apiCall: Function) => Promise<any>
): void {
  wrapper.executeWithRetry.mockImplementation(implementation);
}

/**
 * Setup a mock error response for a specific method
 * This is an alias for setupMockResponse that makes error handling explicit
 *
 * @param mockClient - The mock client
 * @param resource - Resource name (e.g., 'timeEntries', 'projects')
 * @param method - Method name (e.g., 'list', 'single', 'create')
 * @param errorResponse - Error response to return
 */
export function setupMockError(
  mockClient: MockFreshBooksClient,
  resource: keyof MockFreshBooksClient,
  method: string,
  errorResponse: any
): void {
  setupMockResponse(mockClient, resource, method, errorResponse);
}

/**
 * Reset all mocks on a mock client
 *
 * @param mockClient - The mock client to reset
 */
export function resetMockClient(mockClient: MockFreshBooksClient): void {
  // Reset timeEntries mocks
  Object.values(mockClient.timeEntries).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });

  // Reset projects mocks
  Object.values(mockClient.projects).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });

  // Reset services mocks (including nested rate)
  Object.entries(mockClient.services).forEach(([key, value]) => {
    if (key === 'rate' && typeof value === 'object') {
      Object.values(value).forEach((fn) => {
        if (typeof fn === 'function' && 'mockClear' in fn) {
          (fn as any).mockClear();
        }
      });
    } else if (typeof value === 'function' && 'mockClear' in value) {
      value.mockClear();
    }
  });

  // Reset tasks mocks
  Object.values(mockClient.tasks).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });

  // Reset users mocks
  Object.values(mockClient.users).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
}
