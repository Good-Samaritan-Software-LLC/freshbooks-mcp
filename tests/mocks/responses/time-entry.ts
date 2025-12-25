/**
 * Mock Time Entry Responses
 *
 * Factory functions for creating mock FreshBooks API responses for time entries.
 */

/**
 * Create a mock time entry object
 */
export function createMockTimeEntry(overrides: Partial<any> = {}): any {
  return {
    id: 12345,
    identityId: 67890,
    isLogged: true,
    startedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    clientId: 100,
    projectId: 200,
    taskId: 300,
    serviceId: 400,
    note: 'Working on feature development',
    active: false,
    billable: true,
    billed: false,
    internal: false,
    duration: 3600, // 1 hour in seconds
    timer: null,
    pendingClient: null,
    pendingProject: null,
    pendingTask: null,
    retainerId: null,
    ...overrides,
  };
}

/**
 * Create a mock list response for time entries
 */
export function mockTimeEntryListResponse(
  count: number = 10,
  page: number = 1,
  perPage: number = 30
): any {
  const timeEntries = Array.from({ length: count }, (_, i) =>
    createMockTimeEntry({
      id: 10000 + i,
      note: `Time entry ${i + 1}`,
      duration: 3600 + i * 600, // Varying durations
    })
  );

  return {
    ok: true,
    data: {
      timeEntries,
      pages: {
        page,
        pages: Math.ceil(count / perPage),
        perPage,
        total: count,
      },
    },
  };
}

/**
 * Create an empty list response
 */
export function mockTimeEntryEmptyListResponse(): any {
  return {
    ok: true,
    data: {
      time_entries: [], // Use snake_case to match FreshBooks API
      timeEntries: [], // Keep camelCase for compatibility
      pages: {
        page: 1,
        pages: 0,
        perPage: 30,
        total: 0,
      },
    },
  };
}

/**
 * Create a mock single time entry response
 */
export function mockTimeEntrySingleResponse(overrides: Partial<any> = {}): any {
  return {
    ok: true,
    data: createMockTimeEntry(overrides),
  };
}

/**
 * Create a mock create time entry response
 */
export function mockTimeEntryCreateResponse(input: Partial<any> = {}): any {
  return {
    ok: true,
    data: createMockTimeEntry({
      id: 99999,
      createdAt: new Date().toISOString(),
      startedAt: input.startedAt || new Date().toISOString(),
      ...input,
    }),
  };
}

/**
 * Create a mock update time entry response
 */
export function mockTimeEntryUpdateResponse(timeEntryId: number, updates: Partial<any> = {}): any {
  return {
    ok: true,
    data: createMockTimeEntry({
      id: timeEntryId,
      ...updates,
    }),
  };
}

/**
 * Create a mock delete time entry response
 */
export function mockTimeEntryDeleteResponse(): any {
  return {
    ok: true,
    data: {},
  };
}

/**
 * Create a mock active timer (time entry with active=true)
 */
export function createMockActiveTimer(overrides: Partial<any> = {}): any {
  return createMockTimeEntry({
    active: true,
    isLogged: false,
    duration: 0,
    startedAt: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
    timer: {
      id: 55555,
      isRunning: true,
    },
    ...overrides,
  });
}

/**
 * Create a mock response with active timers
 */
export function mockActiveTimersResponse(count: number = 1): any {
  const activeTimers = Array.from({ length: count }, (_, i) =>
    createMockActiveTimer({
      id: 20000 + i,
      note: `Active timer ${i + 1}`,
    })
  );

  return {
    ok: true,
    data: {
      time_entries: activeTimers, // Use snake_case to match FreshBooks API
      timeEntries: activeTimers, // Keep camelCase for compatibility
      pages: {
        page: 1,
        pages: 1,
        perPage: 30,
        total: count,
      },
    },
  };
}

/**
 * Create a mock not found error
 */
export function mockTimeEntryNotFoundError(timeEntryId: number): any {
  return {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `TimeEntry with id ${timeEntryId} was not found`,
      statusCode: 404,
    },
  };
}
