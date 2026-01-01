import { vi } from "vitest";

/**
 * Mock FreshBooks SDK client for testing
 * Provides vi.fn() mocks for all entity operations
 */
export function createMockFreshBooksClient() {
  return {
    // Time Entries
    timeEntries: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },

    // Projects
    projects: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },

    // Services
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

    // Tasks
    tasks: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },

    // Clients
    clients: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },

    // Invoices
    invoices: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      shareLink: vi.fn(),
    },

    // Expenses
    expenses: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },

    // Expense Categories
    expenseCategories: {
      list: vi.fn(),
      single: vi.fn(),
    },

    // Payments
    payments: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },

    // Items
    items: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },

    // Bills
    bills: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      archive: vi.fn(),
    },

    // Bill Payments
    billPayments: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },

    // Bill Vendors
    billVendors: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },

    // Credit Notes
    creditNotes: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },

    // Other Income
    otherIncomes: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },

    // Journal Entries
    journalEntries: {
      create: vi.fn(),
    },

    // Journal Entry Accounts
    journalEntryAccounts: {
      list: vi.fn(),
    },

    // Callbacks (Webhooks)
    callbacks: {
      list: vi.fn(),
      single: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      verify: vi.fn(),
      resendVerification: vi.fn(),
    },

    // Users
    users: {
      me: vi.fn(),
    },

    // Payment Options
    paymentOptions: {
      single: vi.fn(),
      create: vi.fn(),
      default: vi.fn(),
    },

    // Reports
    reports: {
      paymentsCollected: vi.fn(),
      profitLoss: vi.fn(),
      taxSummary: vi.fn(),
    },
  };
}

/**
 * Type for the mock client
 */
export type MockFreshBooksClient = ReturnType<typeof createMockFreshBooksClient>;

/**
 * Setup a mock response for a specific entity and method
 *
 * @example
 * setupMockResponse(mockClient, 'timeEntries', 'list', mockTimeEntryListResponse())
 */
export function setupMockResponse(
  mockClient: MockFreshBooksClient,
  entity: string,
  method: string,
  response: any
): void {
  const entityClient = (mockClient as any)[entity];
  if (!entityClient) {
    throw new Error(`Entity '${entity}' not found in mock client`);
  }

  const methodFn = entityClient[method];
  if (!methodFn || typeof methodFn !== 'function') {
    throw new Error(`Method '${method}' not found on entity '${entity}'`);
  }

  methodFn.mockResolvedValueOnce(response);
}

/**
 * Setup a mock error for a specific entity and method
 *
 * @example
 * setupMockError(mockClient, 'timeEntries', 'single', mockNotFoundError('TimeEntry', 123))
 */
export function setupMockError(
  mockClient: MockFreshBooksClient,
  entity: string,
  method: string,
  error: any
): void {
  const entityClient = (mockClient as any)[entity];
  if (!entityClient) {
    throw new Error(`Entity '${entity}' not found in mock client`);
  }

  const methodFn = entityClient[method];
  if (!methodFn || typeof methodFn !== 'function') {
    throw new Error(`Method '${method}' not found on entity '${entity}'`);
  }

  methodFn.mockRejectedValueOnce(error);
}

/**
 * Setup multiple mock responses in sequence
 * Useful for testing pagination or retry logic
 *
 * @example
 * setupMockSequence(mockClient, 'timeEntries', 'list', [
 *   mockTimeEntryFirstPage(),
 *   mockTimeEntryMiddlePage(),
 *   mockTimeEntryLastPage()
 * ])
 */
export function setupMockSequence(
  mockClient: MockFreshBooksClient,
  entity: string,
  method: string,
  responses: any[]
): void {
  const entityClient = (mockClient as any)[entity];
  if (!entityClient) {
    throw new Error(`Entity '${entity}' not found in mock client`);
  }

  const methodFn = entityClient[method];
  if (!methodFn || typeof methodFn !== 'function') {
    throw new Error(`Method '${method}' not found on entity '${entity}'`);
  }

  for (const response of responses) {
    methodFn.mockResolvedValueOnce(response);
  }
}

/**
 * Reset all mocks on a client
 */
export function resetMockClient(mockClient: MockFreshBooksClient): void {
  Object.values(mockClient).forEach((entity: any) => {
    if (typeof entity === 'object' && entity !== null) {
      Object.values(entity).forEach((method: any) => {
        if (typeof method === 'function' && method.mockReset) {
          method.mockReset();
        } else if (typeof method === 'object' && method !== null) {
          // Handle nested objects like services.rate
          Object.values(method).forEach((nestedMethod: any) => {
            if (typeof nestedMethod === 'function' && nestedMethod.mockReset) {
              nestedMethod.mockReset();
            }
          });
        }
      });
    }
  });
}

/**
 * Clear all mock calls on a client (keeps implementations)
 */
export function clearMockClient(mockClient: MockFreshBooksClient): void {
  Object.values(mockClient).forEach((entity: any) => {
    if (typeof entity === 'object' && entity !== null) {
      Object.values(entity).forEach((method: any) => {
        if (typeof method === 'function' && method.mockClear) {
          method.mockClear();
        } else if (typeof method === 'object' && method !== null) {
          // Handle nested objects like services.rate
          Object.values(method).forEach((nestedMethod: any) => {
            if (typeof nestedMethod === 'function' && nestedMethod.mockClear) {
              nestedMethod.mockClear();
            }
          });
        }
      });
    }
  });
}
