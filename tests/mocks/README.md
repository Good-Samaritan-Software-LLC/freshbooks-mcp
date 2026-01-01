# FreshBooks MCP Mocks

Comprehensive mock data and response factories for testing the FreshBooks MCP server without requiring a live API connection.

## Overview

This mock system provides:

1. **Factories** - Generate realistic entity data with faker.js
2. **Responses** - Wrap entities in FreshBooks API response format
3. **Errors** - Cover all error scenarios (validation, auth, server, etc.)
4. **Auth** - OAuth flow mocks (tokens, account selection)
5. **Client** - Mock FreshBooks SDK client with vitest spies

## Directory Structure

```
tests/mocks/
├── index.ts                    # Main export - import everything from here
├── README.md                   # This file
├── factories/
│   ├── index.ts
│   ├── time-entry.factory.ts   # TimeEntry data generation
│   ├── project.factory.ts      # Project data generation
│   ├── service.factory.ts      # Service data generation
│   └── task.factory.ts         # Task data generation
├── responses/
│   ├── index.ts
│   ├── time-entry.responses.ts # TimeEntry API responses
│   ├── project.responses.ts    # Project API responses
│   ├── service.responses.ts    # Service API responses
│   └── task.responses.ts       # Task API responses
├── errors/
│   ├── index.ts
│   └── freshbooks-errors.ts    # All error scenarios
├── auth/
│   ├── index.ts
│   └── oauth.mocks.ts          # OAuth token and account mocks
└── client/
    ├── index.ts
    └── mock-freshbooks-client.ts # Mock SDK client
```

## Quick Start

### Import Mocks

```typescript
import {
  // Factories
  createTimeEntry,
  createProject,
  createService,
  createTask,

  // Responses
  mockTimeEntryListResponse,
  mockProjectSingleResponse,

  // Errors
  mockNotFoundError,
  mockValidationError,

  // Client
  createMockFreshBooksClient,
  setupMockResponse,
} from '../mocks';
```

### Create Entity Data

```typescript
// Create a single entity with defaults
const entry = createTimeEntry();

// Override specific fields
const customEntry = createTimeEntry({
  duration: 3600,
  note: 'Meeting with client',
  billable: true,
});

// Create multiple entities
const entries = createTimeEntryList(10);

// Use specialized factories
const activeTimer = createActiveTimer();
const billedEntry = createBilledTimeEntry();
```

### Mock API Responses

```typescript
// Success responses
const listResponse = mockTimeEntryListResponse(10); // 10 items, page 1
const singleResponse = mockProjectSingleResponse({ title: 'Test Project' });
const createResponse = mockServiceCreateResponse({ name: 'Consulting' });

// Pagination scenarios
const firstPage = mockTimeEntryFirstPage(100, 30); // 100 total, 30 per page
const middlePage = mockTimeEntryMiddlePage(2, 100, 30); // Page 2
const lastPage = mockTimeEntryLastPage(100, 30);
const emptyPage = mockTimeEntryBeyondLastPage(100, 30);

// Empty results
const emptyList = mockTimeEntryEmptyListResponse();
```

### Mock Errors

```typescript
// Not found
const notFound = mockNotFoundError('TimeEntry', 123);

// Validation errors
const required = mockRequiredFieldError('duration');
const invalid = mockInvalidValueError('duration', -100);
const wrongType = mockInvalidTypeError('duration', 'number', 'string');

// Auth errors
const unauthorized = mockUnauthorizedError();
const forbidden = mockForbiddenError('projects');
const invalidAccount = mockInvalidAccountError('ABC123');

// Rate limiting
const rateLimit = mockRateLimitError(60); // Retry after 60 seconds

// Server errors
const serverError = mockServerError();
const unavailable = mockServiceUnavailableError();

// Business logic errors
const concurrentTimer = mockConcurrentTimerError();
const noTimer = mockNoActiveTimerError();
```

### Mock FreshBooks Client

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockFreshBooksClient,
  setupMockResponse,
  setupMockError,
  mockTimeEntryListResponse,
  mockNotFoundError,
} from '../mocks';

describe('MyTool', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = createMockFreshBooksClient();
  });

  it('should list time entries', async () => {
    // Setup mock response
    setupMockResponse(
      mockClient,
      'timeEntries',
      'list',
      mockTimeEntryListResponse(5)
    );

    // Your test code that calls mockClient.timeEntries.list()
    const result = await mockClient.timeEntries.list();

    expect(result.ok).toBe(true);
    expect(result.data.timeEntries).toHaveLength(5);
  });

  it('should handle not found error', async () => {
    // Setup mock error
    setupMockError(
      mockClient,
      'timeEntries',
      'single',
      mockNotFoundError('TimeEntry', 999)
    );

    // Your test code
    const result = await mockClient.timeEntries.single();

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('NOT_FOUND');
  });
});
```

## Factory Reference

### Time Entry Factories

```typescript
createTimeEntry(overrides?)          // Generic time entry
createTimeEntryList(count, overrides?) // Multiple entries
createActiveTimer(overrides?)        // Running timer
createLoggedTimeEntry(overrides?)    // Completed entry
createBillableTimeEntry(overrides?)  // Billable but not billed
createBilledTimeEntry(overrides?)    // Already billed
createInternalTimeEntry(overrides?)  // Non-billable internal work
```

### Project Factories

```typescript
createProject(overrides?)            // Generic project
createProjectList(count, overrides?) // Multiple projects
createActiveProject(overrides?)      // Active project
createCompletedProject(overrides?)   // Completed project
createInternalProject(overrides?)    // Internal project
createFixedPriceProject(overrides?)  // Fixed price billing
createHourlyRateProject(overrides?)  // Hourly billing
```

### Service Factories

```typescript
createService(overrides?)            // Generic service
createServiceList(count, overrides?) // Multiple services
createServiceRate(overrides?)        // Service rate object
createBillableService(overrides?)    // Billable service
createNonBillableService(overrides?) // Non-billable service
createArchivedService(overrides?)    // Archived (visState=2)
createDeletedService(overrides?)     // Deleted (visState=1)
```

### Task Factories

```typescript
createTask(overrides?)               // Generic task
createTaskList(count, overrides?)    // Multiple tasks
createBillableTask(overrides?)       // Billable task
createNonBillableTask(overrides?)    // Non-billable task
createArchivedTask(overrides?)       // Archived task
createDeletedTask(overrides?)        // Deleted task
createMoney(amount?, code?)          // Money object
```

## Response Reference

### Success Responses

All entities support these response patterns:

```typescript
// Single item
mock{Entity}SingleResponse(overrides?)

// List
mock{Entity}ListResponse(count, page?, perPage?)

// Empty list
mock{Entity}EmptyListResponse()

// Create
mock{Entity}CreateResponse(input)

// Update
mock{Entity}UpdateResponse(id, changes)

// Delete
mock{Entity}DeleteResponse()
```

### Pagination Responses

```typescript
// First page
mock{Entity}FirstPage(total, perPage?)

// Middle page
mock{Entity}MiddlePage(page, total, perPage?)

// Last page
mock{Entity}LastPage(total, perPage?)

// Beyond last page (empty but valid)
mock{Entity}BeyondLastPage(total, perPage?)
```

## Error Reference

### HTTP Errors

```typescript
mockBadRequestError(message?)        // 400
mockUnauthorizedError()              // 401
mockForbiddenError(resource)         // 403
mockNotFoundError(entity, id)        // 404
mockConflictError(entity, field)     // 409
mockRateLimitError(retryAfter?)      // 429
mockServerError(message?)            // 500
mockServiceUnavailableError()        // 503
```

### Validation Errors

```typescript
mockValidationError(field, message)
mockRequiredFieldError(field)
mockInvalidValueError(field, value)
mockInvalidTypeError(field, expected, actual)
mockOutOfRangeError(field, min?, max?)
```

### Business Logic Errors

```typescript
mockBusinessLogicError(message)
mockConcurrentTimerError()           // Timer already running
mockNoActiveTimerError()             // No timer to stop
mockInvalidStateTransitionError(from, to)
```

### Resource State Errors

```typescript
mockArchivedResourceError(entity, id)
mockDeletedResourceError(entity, id)
mockResourceLockedError(entity, id)
mockImmutableResourceError(entity)
```

### Network Errors

```typescript
mockNetworkTimeoutError()
mockNetworkConnectionError()
```

## Auth/OAuth Reference

```typescript
// Token responses
mockTokenResponse(overrides?)
mockExpiredTokenResponse()
mockTokenRefreshResponse()

// OAuth errors
mockInvalidGrantError()
mockInvalidClientError()
mockInvalidRequestError(description?)
mockUnauthorizedClientError()
mockUnsupportedGrantTypeError()

// Account selection
mockAccountListResponse(businessCount?)
mockAccountListResponseWithAccount(accountId, businessName?)
mockEmptyAccountListResponse()
mockMultipleAccountsResponse()
```

## Client Helpers

```typescript
// Create client
const client = createMockFreshBooksClient();

// Setup responses
setupMockResponse(client, 'timeEntries', 'list', response);
setupMockError(client, 'projects', 'single', error);

// Setup sequence (for pagination tests)
setupMockSequence(client, 'timeEntries', 'list', [
  mockTimeEntryFirstPage(100),
  mockTimeEntryMiddlePage(2, 100),
  mockTimeEntryLastPage(100),
]);

// Reset mocks
resetMockClient(client);  // Clear all mocks
clearMockClient(client);  // Clear calls but keep implementations
```

## Coverage Requirements

Use these mocks to achieve 100% test coverage by testing:

- **Success scenarios**: All CRUD operations
- **Empty results**: Empty lists, no active timer
- **Pagination**: First/middle/last/beyond pages
- **Validation errors**: Required fields, invalid values, wrong types
- **Auth errors**: Unauthorized, forbidden, invalid account
- **Resource states**: Active, archived, deleted, locked
- **Business logic**: Timer conflicts, state transitions
- **Network issues**: Timeouts, connection failures
- **Edge cases**: Max values, null fields, unicode data

## Best Practices

1. **Use specific factories** for common scenarios (e.g., `createActiveTimer()` instead of `createTimeEntry({ active: true })`)
2. **Override only what you need** - factories provide realistic defaults
3. **Test pagination thoroughly** - use the pagination helpers
4. **Cover all error paths** - don't just test success cases
5. **Reset mocks between tests** - use `beforeEach(() => resetMockClient(client))`
6. **Use TypeScript** - mocks are fully typed for safety

## Examples

### Complete Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockFreshBooksClient,
  setupMockResponse,
  setupMockError,
  mockTimeEntryListResponse,
  mockTimeEntryEmptyListResponse,
  mockNotFoundError,
  mockConcurrentTimerError,
  createActiveTimer,
} from '../mocks';
import { timeEntryListTool } from '../../src/tools/time-entry/time-entry-list';

describe('timeentry_list tool', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = createMockFreshBooksClient();
  });

  it('should list time entries successfully', async () => {
    setupMockResponse(
      mockClient,
      'timeEntries',
      'list',
      mockTimeEntryListResponse(5)
    );

    const result = await timeEntryListTool.execute({
      accountId: 'ABC123',
    }, mockClient);

    expect(result.content[0].text).toContain('5 time entries');
  });

  it('should handle empty results', async () => {
    setupMockResponse(
      mockClient,
      'timeEntries',
      'list',
      mockTimeEntryEmptyListResponse()
    );

    const result = await timeEntryListTool.execute({
      accountId: 'ABC123',
    }, mockClient);

    expect(result.content[0].text).toContain('No time entries found');
  });

  it('should handle pagination', async () => {
    setupMockResponse(
      mockClient,
      'timeEntries',
      'list',
      mockTimeEntryFirstPage(100, 30)
    );

    const result = await timeEntryListTool.execute({
      accountId: 'ABC123',
      page: 1,
      perPage: 30,
    }, mockClient);

    expect(result.content[0].text).toContain('Page 1 of 4');
  });

  it('should handle not found error', async () => {
    setupMockError(
      mockClient,
      'timeEntries',
      'list',
      mockNotFoundError('TimeEntry', 999)
    );

    await expect(
      timeEntryListTool.execute({ accountId: 'ABC123' }, mockClient)
    ).rejects.toThrow('not found');
  });
});
```

## Type Safety

All mocks are fully typed using TypeScript interfaces from `src/types/freshbooks.ts`:

```typescript
import type {
  TimeEntry,
  Project,
  Service,
  Task,
  FreshBooksResponse,
  PaginationMeta,
} from '../../src/types/freshbooks';
```

This ensures:
- Autocomplete in your IDE
- Type checking at compile time
- Prevents typos and mismatches
- Self-documenting code

## Contributing

When adding new entities or operations:

1. Add types to `src/types/freshbooks.ts`
2. Create factory in `tests/mocks/factories/{entity}.factory.ts`
3. Create responses in `tests/mocks/responses/{entity}.responses.ts`
4. Export from respective `index.ts` files
5. Update this README with examples

## Related Documentation

- [FreshBooks API Docs](https://www.freshbooks.com/api)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Faker.js Documentation](https://fakerjs.dev/)
